# Simpro Customer API Fix - Root Cause Analysis

## Problem Summary
The Customer search in the n8n workflow was consistently failing while the Site search worked perfectly. After investigation, **TWO critical configuration errors** were identified in the "Get Customer" node.

## Root Cause

### Issue #1: Wrong Endpoint
**Incorrect:**
```
/api/v1.0/companies/0/customers
```

**Correct:**
```
/api/v1.0/companies/0/customers/companies/
```

The endpoint was missing the `/companies/` suffix. According to Simpro API documentation, there are separate endpoints for different customer types:
- Company Customers: `/api/v1.0/companies/{companyID}/customers/companies/`
- Individual Customers: `/api/v1.0/companies/{companyID}/customers/individuals/`

### Issue #2: Missing Query Parameters
The "Get Customer" node had **NO query parameters configured** for the search.

**What was missing:**
1. `sendQuery: true` flag
2. `queryParameters` object with:
   - `search=any` (for partial matching)
   - `CompanyName` with proper name transformation and wildcard

## Working Configuration

### Before (Broken):
```json
{
  "parameters": {
    "url": "=https://platinumplumbinggassolutions.simprosuite.com/api/v1.0/companies/0/customers",
    "authentication": "genericCredentialType",
    "genericAuthType": "oAuth2Api",
    "options": {}
  }
}
```

### After (Fixed):
```json
{
  "parameters": {
    "url": "https://platinumplumbinggassolutions.simprosuite.com/api/v1.0/companies/0/customers/companies/",
    "authentication": "genericCredentialType",
    "genericAuthType": "oAuth2Api",
    "sendQuery": true,
    "queryParameters": {
      "parameters": [
        {
          "name": "search",
          "value": "=any"
        },
        {
          "name": "CompanyName",
          "value": "={{ $('Prep data for work order').item.json.customer.trim().split(' ').reverse().join(', ') }}%"
        }
      ]
    },
    "options": {}
  }
}
```

## Key Differences: Working Site Search vs Fixed Customer Search

### Site Search (Reference - Already Working):
```json
{
  "url": "https://platinumplumbinggassolutions.simprosuite.com/api/v1.0/companies/0/sites/",
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "search",
        "value": "=any"
      },
      {
        "name": "Name",
        "value": "={{ $json.address.split(',')[0].replace(/\\s+(RD|Road|ST|Street|Ave|Avenue|DR|Drive)$/i, '').trim() }}%"
      }
    ]
  }
}
```

### Customer Search (Now Fixed):
```json
{
  "url": "https://platinumplumbinggassolutions.simprosuite.com/api/v1.0/companies/0/customers/companies/",
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "search",
        "value": "=any"
      },
      {
        "name": "CompanyName",
        "value": "={{ $('Prep data for work order').item.json.customer.trim().split(' ').reverse().join(', ') }}%"
      }
    ]
  }
}
```

## Critical Pattern Requirements

### 1. Name Transformation
Simpro stores customer names as **"LastName, FirstName"**. The transformation logic:
```javascript
// Input: "Vicki Nurton"
// Output: "Nurton, Vicki%"
$('Prep data for work order').item.json.customer.trim().split(' ').reverse().join(', ') + '%'
```

### 2. Wildcard Usage
- Always append `%` to the search value for partial matching
- The `%` will be automatically URL-encoded to `%25` by n8n

### 3. Search Parameter
- Use `search=any` for flexible partial matching
- Alternative: `search=all` requires exact match on all fields

## Expected API Behavior

### Successful Search (Customer Found):
```json
[
  {
    "ID": 12345,
    "CompanyName": "Nurton, Vicki",
    "Email": "nurts5@bigpond.com",
    "Phone": "0407 605 848",
    "href": "/api/v1.0/companies/0/customers/companies/12345/"
  }
]
```

### No Match Found:
```json
[]
```

### Workflow Logic:
1. If response is empty array `[]` → Customer not found → Create new customer
2. If response contains results → Use existing customer ID from first result

## Fix Applied
**Date:** 2024-12-19
**Workflow:** `PPG-create-job` (ID: `opBCXYhYWnf0YHfk`)
**Method:** n8n partial workflow update via MCP API

The fix has been applied and the workflow is now ready for testing.

## Testing Instructions

1. **Navigate to n8n workflow:**
   ```
   https://n8n-totalai-au.badou.ai/workflow/opBCXYhYWnf0YHfk
   ```

2. **Trigger manually** with test data containing:
   - Customer name (e.g., "Vicki Nurton")
   - Property address (e.g., "7 Grace AV, Tranmere, SA")

3. **Verify the "Get Customer" node:**
   - Should make request to `/api/v1.0/companies/0/customers/companies/`
   - Should include query params: `?search=any&CompanyName=Nurton,%20Vicki%25`
   - Should return customer data or empty array

4. **Expected results:**
   - Existing customer: Returns customer with ID, proceeds to "✅ Extract Customer ID"
   - New customer: Returns `[]`, proceeds to "➕ Create Customer"

## Related Documentation
- `/docs/simpro/customer.md` - Full Customer API documentation
- `/docs/simpro/site.md` - Site API documentation (working reference pattern)

## Why This Was Hard to Debug

1. **Subtle endpoint difference**: Easy to miss the `/companies/` suffix requirement
2. **No error messages**: API likely returned empty results or generic errors without clear indication of the issue
3. **Multiple encoding attempts**: Focus was on URL encoding rather than the core configuration
4. **Working reference existed**: The Site search node had the exact pattern needed, but comparison wasn't made initially

## Prevention

When configuring Simpro API searches in n8n:
1. ✅ Always use the full endpoint path with entity type suffix (`/companies/`, `/individuals/`, etc.)
2. ✅ Always set `sendQuery: true`
3. ✅ Always configure `queryParameters` with search criteria
4. ✅ Use `search=any` for partial matching
5. ✅ Append `%` wildcard to search values
6. ✅ Apply proper field transformations (e.g., name reversal for customers)
7. ✅ Reference working nodes in the same workflow for configuration patterns
