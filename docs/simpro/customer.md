# Customers
In Simpro, a customer is an entity, such as a company or individual, that receives your invoice for the work performed.

**URL:**
```bash
https://platinumplumbinggassolutions.simprosuite.com/api/v1.0/companies/0/sites/
```
**GET ALL**
```bash
/api/v1.0/companies/{companyID}/customers/
```

**Path Parameters:**
- **companyID** (required) - Example `12345`. A build with Multi-company setup may have companyID >= 0, other builds use 0 by default.

**Query Parameters:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Query Parameters",
  "type": "object",
  "properties": {
    "search": {
      "type": "string",
      "default": "all",
      "enum": [
        "all",
        "any"
      ],
      "description": "Search result must have a match on all provided fields or a match on any of the provided fields."
    },
    "columns": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "When listing or searching a resource, specify which columns to be displayed"
    },
    "pageSize": {
      "type": "integer",
      "default": 30,
      "minimum": 1,
      "maximum": 250,
      "description": "The maximum number of results to be returned by a request."
    },
    "page": {
      "type": "integer",
      "default": 1,
      "description": "Set the page number on paginated request"
    },
    "orderby": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Set the order of the requested records, by prefixing '-' on the column name you can get records by descending order. Comma separated list can also be provided."
    },
    "limit": {
      "type": "integer",
      "description": "Set the limit of number of records in a request"
    }
  }
}
```
**Response schema:**
```json
[{
    "ID": {
        "type": "integer",
        "description": "This customer's ID"
    },
    "href": {
        "type": "string",
        "description": "Link to this customer's details"
    },
    "CompanyName": {
        "type": "string",
        "description": "Company name (Company customers)"
    },
    "GivenName": {
        "type": "string",
        "description": "Given name / First name (Individual customers)"
    },
    "FamilyName": {
        "type": "string",
        "description": "Family name / Last name (Individual customers)"
    }
}]
```

**List All Company Customers**

**GET**
```bash
/api/v1.0/companies/{companyID}/customers/companies/
```
**Query Parameters:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Query Parameters",
  "type": "object",
  "properties": {
    "search": {
      "type": "string",
      "default": "all",
      "enum": [
        "all",
        "any"
      ],
      "description": "Search result must have a match on all provided fields or a match on any of the provided fields."
    },
    "columns": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "When listing or searching a resource, specify which columns to be displayed"
    },
    "pageSize": {
      "type": "integer",
      "default": 30,
      "minimum": 1,
      "maximum": 250,
      "description": "The maximum number of results to be returned by a request."
    },
    "page": {
      "type": "integer",
      "default": 1,
      "description": "Set the page number on paginated request"
    },
    "orderby": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Set the order of the requested records, by prefixing '-' on the column name you can get records by descending order. Comma separated list can also be provided."
    },
    "limit": {
      "type": "integer",
      "description": "Set the limit of number of records in a request"
    }
  }
}
```
---

## Create a New Company Customer

**POST**
```bash
/api/v1.0/companies/{companyID}/customers/{customerType}/
```

**Path Parameters:**
- **companyID** (integer, required) - Example: `12345`. A build with Multi-company setup may have companyID >= 0, other builds use 0 by default.
- **customerType** (string, required) - A valid customer type

**Query Parameters:**
- **createSite** (boolean, optional) - Example: `true&field1=example&field2=true&field3=description`. Add an associated site when creating the customer.

**Request Body Schema: application/json**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Company Customer Object",
  "type": "object",
  "required": [
    "CompanyName",
    "CustomerType"
  ],
  "properties": {
    "CompanyName": {
      "type": "string",
      "description": "Company name (Company customers)"
    },
    "PreferredMethod": {
      "type": "array",
      "items": {
        "type": "object"
      },
      "description": "Assign preferred invoice/quotes to have them automatically assigned to relevant quotes and jobs"
    },
    "Phone": {
      "type": "string",
      "description": "Can only contact through phone"
    },
    "IndirectCall": {
      "type": "boolean",
      "description": "Can't call them through phone"
    },
    "AltPhone": {
      "type": "string",
      "description": "Alternative telephone number"
    },
    "Address": {
      "type": "object",
      "description": "The physical address of the customer's office"
    },
    "BillingAddress": {
      "type": "object",
      "description": "The mailing address for the customer's bills"
    },
    "CustomerType": {
      "type": "string",
      "enum": [
        "Customer",
        "Customer - Lead"
      ],
      "description": "Whether this is a customer or a lead"
    },
    "Tags": {
      "type": "array",
      "items": {
        "type": "integer"
      },
      "description": "An array of user-defined tags which apply to this customer. See People → Tags"
    },
    "Notes": {
      "type": "object"
    },
    "Profile": {
      "type": "object"
    },
    "Banking": {
      "type": "object"
    },
    "Invoiced": {
      "type": "boolean",
      "description": "Whether this customer is archived"
    },
    "Sites": {
      "type": "array",
      "items": {
        "type": "integer"
      },
      "description": "Array of sites to which this customer is linked. See People → Sites"
    },
    "Email": {
      "type": "string"
    },
    "EIN": {
      "type": "string",
      "description": "EIN / ABN / GST No / Vat Reg No"
    },
    "Website": {
      "type": "string"
    },
    "CompanyNumber": {
      "type": "string",
      "description": "Company Number (UK Only)"
    }
  }
}
```

**Response Schema (201 - Created Successfully):**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "ID": {
      "type": "integer",
      "description": "This customer's ID"
    },
    "CompanyName": {
      "type": "string",
      "description": "Company name (Company customers)"
    },
    "Email": {
      "type": "string"
    },
    "Phone": {
      "type": "string",
      "description": "Telephone number"
    },
    "AltPhone": {
      "type": "string",
      "description": "Alternative telephone number"
    },
    "Address": {
      "type": "object",
      "description": "The physical address of the customer's office"
    },
    "BillingAddress": {
      "type": "object",
      "description": "The mailing address for the customer's bills"
    },
    "CustomerType": {
      "type": "string"
    },
    "DateCreated": {
      "type": "string",
      "format": "date-time",
      "description": "RFC3339 date-time format eg. 2018-05-21T19:53:33+10:00"
    },
    "DateModified": {
      "type": "string",
      "format": "date-time",
      "description": "RFC3339 date-time format eg. 2018-05-21T19:53:39+10:00"
    }
  }
}
```

**Response Error:**
- **422**: Body contains invalid data

**Example Minimal Request:**
```json
{
  "CompanyName": "Vicki Nurton",
  "CustomerType": "Customer",
  "Email": "nurts5@bigpond.com",
  "Phone": "0407 605 848"
}
```

---

## Retrieve Details for a Specific Company Customer

**GET**
```bash
/api/v1.0/companies/{companyID}/customers/{customerType}/{customerID}/
```

**Path Parameters:**
- **companyID** (integer, required) - Example: `12345`. A build with Multi-company setup may have companyID >= 0, other builds use 0 by default.
- **customerType** (integer, required) - Example: `12345`. A valid customer type
- **customerID** (integer, required) - Example: `12345`. A valid customer id

**Query Parameters:**
- **columns** (array of strings, optional) - Example: `columns=ID,Name`. When listing or searching a resource, specify which columns to be displayed

**Response Schema (200 - Company customer details):**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "ID": {
      "type": "integer",
      "description": "This customer's ID"
    },
    "CompanyName": {
      "type": "string",
      "description": "Company name (Company customers)"
    },
    "PreferredMethod": {
      "type": "array",
      "items": {
        "type": "object"
      },
      "description": "Assign preferred technicians to have them automatically assigned to relevant quotes and jobs"
    },
    "Phone": {
      "type": "string",
      "description": "Telephone number"
    },
    "DoNotCall": {
      "type": "boolean",
      "description": "Do not contact through phone"
    },
    "AltPhone": {
      "type": "string",
      "description": "Alternative telephone number"
    },
    "Address": {
      "type": "object",
      "description": "The physical address of the customer's office"
    },
    "BillingAddress": {
      "type": "object",
      "description": "The mailing address for the customer's bills"
    },
    "CustomerType": {
      "type": "string",
      "default": "Customer",
      "enum": [
        "Customer",
        "Customer - Lead"
      ],
      "description": "Whether this is a customer or a lead"
    },
    "Tags": {
      "type": "array",
      "items": {
        "type": "object"
      },
      "description": "An array of user-defined tags which apply to this customer. See Setup -> Tags -> Customer Tags"
    },
    "AmountOwing": {
      "type": "number",
      "description": "1=On | null=0 | 0=Off"
    },
    "Notes": {
      "type": "object"
    },
    "Profile": {
      "type": "object"
    },
    "Banking": {
      "type": "object"
    },
    "Archived": {
      "type": "boolean",
      "description": "Whether this customer is archived"
    },
    "Sites": {
      "type": "array",
      "items": {
        "type": "object"
      },
      "description": "Array of sites to which this customer is linked. See People -> Sites"
    },
    "Contracts": {
      "type": ["array", "null"],
      "items": {
        "type": "object"
      },
      "description": "Collection of customer contracts"
    },
    "Contacts": {
      "type": ["array", "null"],
      "items": {
        "type": "object"
      },
      "description": "Collection of customer contacts"
    },
    "ResponseTimes": {
      "type": ["array", "null"],
      "items": {
        "type": "object"
      },
      "description": "Customer Response Times"
    },
    "CustomerFields": {
      "type": "array",
      "items": {
        "type": "object"
      },
      "description": "All of the custom fields for this company customer. See the custom fields handler for more information."
    },
    "Email": {
      "type": "string"
    },
    "DateModified": {
      "type": "string",
      "format": "date-time",
      "description": "RFC3339 date-time format eg. 2018-05-21T19:53:39+10:00. See https://tools.ietf.org/html/rfc3339#section-5.6"
    },
    "DateCreated": {
      "type": "string",
      "format": "date-time",
      "description": "RFC3339 date-time format eg. 2018-05-21T19:53:39+10:00. See https://tools.ietf.org/html/rfc3339#section-5.6"
    },
    "EIN": {
      "type": "string",
      "description": "EIN / ABN / GST No / Vat Reg No"
    },
    "Website": {
      "type": "string"
    },
    "Fax": {
      "type": "string"
    },
    "CompanyNumber": {
      "type": "string",
      "description": "Company Number (UK Only)"
    }
  }
}
```

**Response Error:**
- **404**: Company customer not found

---

## Search Customers by Name

**Important**: Simpro does NOT support filtering by email directly. Customer search must be done by **CompanyName** using the naming convention: `"LastName, FirstName"`.

**GET**
```bash
/api/v1.0/companies/{companyID}/customers/?search=any&CompanyName={formattedName}
```

**Query Parameters:**
- **search** (required) - Set to `"any"` for partial matching
- **CompanyName** (string) - Customer name in format: `"LastName, FirstName%"`
  - Use `%` wildcard at the end for partial matching
  - Example: `CompanyName=Nurton, Vicki%`

**Name Formatting:**

Simpro stores customer names as **"LastName, FirstName"**. You must reverse the typical "First Last" format.

**Transformation Logic:**
```javascript
// Input: "Vicki Nurton"
// Output: "Nurton, Vicki%"

const formattedName = customerName.trim().split(" ").reverse().join(", ") + "%";
```

**n8n Expression:**
```javascript
{{ $json.tenantName.trim().split(" ").reverse().join(", ") }}%
```

**Example Request:**
```bash
GET /api/v1.0/companies/0/customers/?search=any&CompanyName=Nurton, Vicki%
```

**Example Response (200 - Customers Found):**
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

**Empty Response (No Match):**
```json
[]
```

**Workflow Logic:**
1. Format customer name: `"First Last"` → `"Last, First%"`
2. Search using formatted name
3. If response is empty array `[]` → Customer not found, create new customer
4. If response contains results → Use existing customer ID from first result

**Note**: This search returns an array. Always check:
- Empty array `[]` = no match found
- Non-empty array = customers found (use first result's `ID`)

---

## Important Notes on Customer Search

### Company vs Individual Customers

Simpro has **separate endpoints** for different customer types:

**Company Customers:**
```bash
GET /api/v1.0/companies/{companyID}/customers/companies/
```

**Individual Customers:**
```bash
GET /api/v1.0/companies/{companyID}/customers/individuals/
```

For our workflow, we store tenants as **Company Customers** with CompanyName in "LastName, FirstName" format.

### URL Encoding for Wildcards

The `%` wildcard character must be **URL-encoded as `%25`** in query parameters.

**❌ Incorrect:**
```bash
GET /companies/0/customers/companies/?CompanyName=Nurton, Vicki%
```

**✅ Correct:**
```bash
GET /companies/0/customers/companies/?CompanyName=Nurton,%20Vicki%25
```

**URL Encoding Reference:**
- Space: `%20`
- Wildcard `%`: `%25`
- Comma: `,` (no encoding needed)

### Search Logic

**search=all** (default): Results must match ALL query parameters
```bash
?GivenName=John&FamilyName=Smith&search=all
# Returns only customers where BOTH match
```

**search=any**: Results can match ANY query parameter
```bash
?CompanyName=Nurton, Vicki%25&search=any
# Returns customers matching the CompanyName pattern
```

**For our workflow:** Always use `search=any` for flexible matching.

---

## n8n HTTP Request Configuration

### Complete Working Configuration for Customer Search

When configuring the HTTP Request node in n8n to search for customers, use this exact pattern:

```json
{
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
```

### Critical Configuration Requirements

1. **Endpoint URL**: Must end with `/customers/companies/` (not just `/customers`)
2. **sendQuery**: Must be set to `true`
3. **queryParameters**: Must include both `search` and `CompanyName` parameters
4. **Name transformation**: Must reverse "First Last" to "Last, First%"
5. **Wildcard**: Must append `%` for partial matching (auto-encoded to `%25`)

### Common Mistakes to Avoid

❌ **Wrong endpoint** (missing `/companies/` suffix):
```
/api/v1.0/companies/0/customers
```

❌ **Missing sendQuery flag**:
```json
{
  "url": "...",
  "authentication": "..."
  // Missing sendQuery: true
}
```

❌ **No query parameters**:
```json
{
  "url": "...",
  "sendQuery": true
  // Missing queryParameters object
}
```

❌ **Wrong search field** (using email instead of CompanyName):
```json
{
  "name": "Email",
  "value": "customer@example.com"
}
```

✅ **Correct configuration** (as shown above)

### Troubleshooting

**Problem**: Customer search returns empty array `[]` for known customers

**Solutions**:
1. Verify endpoint ends with `/customers/companies/`
2. Check `sendQuery: true` is set
3. Ensure `queryParameters` object exists with search criteria
4. Verify name transformation reverses to "Last, First%"
5. Confirm `%` wildcard is appended
6. Test in Simpro UI that customer exists with exact CompanyName format

**Problem**: API returns 404 or authentication errors

**Solutions**:
1. Verify OAuth2 credentials are configured
2. Check API base URL matches your Simpro instance
3. Ensure company ID is correct (usually `0` for single-company setups)
