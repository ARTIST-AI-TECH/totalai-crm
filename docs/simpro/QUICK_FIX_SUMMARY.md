# Customer API Fix - Quick Summary

## Status: ✅ FIXED

**Date:** 2024-12-19
**Workflow:** PPG-create-job (opBCXYhYWnf0YHfk)
**Issue:** Customer search consistently failing (returning no results)
**Impact:** Complete workflow blocker - cannot create jobs without customer ID

## Root Cause (2 Issues)

### 1. Wrong Endpoint ❌
```
Before: /api/v1.0/companies/0/customers
After:  /api/v1.0/companies/0/customers/companies/
```

### 2. Missing Query Parameters ❌
The node had NO search parameters configured (no `sendQuery`, no `queryParameters`)

## The Fix

Changed the "Get Customer" node from:
```json
{
  "url": "...companies/0/customers",
  "authentication": "oAuth2Api"
}
```

To:
```json
{
  "url": "...companies/0/customers/companies/",
  "authentication": "oAuth2Api",
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {"name": "search", "value": "=any"},
      {"name": "CompanyName", "value": "={{ ... }}%"}
    ]
  }
}
```

## How It Works Now

1. **Name transformation**: "Vicki Nurton" → "Nurton, Vicki%"
2. **API request**: `GET /customers/companies/?search=any&CompanyName=Nurton,%20Vicki%25`
3. **Success response**: `[{ID: 12345, CompanyName: "Nurton, Vicki", ...}]`
4. **No match**: `[]` (triggers customer creation)

## Pattern Match with Working Site Search

Both nodes now follow the same pattern:

| Aspect | Site Search | Customer Search |
|--------|-------------|-----------------|
| Endpoint | `/sites/` | `/customers/companies/` |
| sendQuery | ✅ true | ✅ true |
| Query params | ✅ search + Name | ✅ search + CompanyName |
| Wildcard | ✅ `%` appended | ✅ `%` appended |
| Transformation | Address normalization | Name reversal |

## Next Steps

1. ✅ Fix applied to workflow
2. ⏳ Test with real work order email
3. ⏳ Verify customer found/created correctly
4. ⏳ Complete job creation flow
5. ⏳ Enable workflow for production

## Documentation

- **Full analysis**: `/docs/simpro/CUSTOMER_API_FIX.md`
- **API reference**: `/docs/simpro/customer.md` (updated with n8n config)
- **Workflow**: https://n8n-totalai-au.badou.ai/workflow/opBCXYhYWnf0YHfk
