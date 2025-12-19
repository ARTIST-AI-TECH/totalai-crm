# Sites API Documentation

In Simpro, sites are physical locations where you perform work for a customer.

## List All Sites

Retrieves a list of all sites for a company.

### Endpoint
```
GET /api/v1.0/companies/{companyID}/sites/
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| companyID | integer | Yes | A build with Multi-company setup may have companyID >= 0, other builds use 0 by default. |

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| search | string | "all" | Search result must have a match on all provided fields or a match on any of the provided fields. Enum: `"all"`, `"any"`. Example: `search=search=any` |
| columns | array of strings | - | When listing or searching a resource, specify which columns to be displayed. Example: `columns=columns=ID,Name` |
| pageSize | integer | 30 | The maximum number of results to be returned by a request. Range: 1-250. Example: `pageSize=pageSize=50` |
| page | integer | 1 | Set the page number on paginated request. Example: `page=page=2` |
| orderby | array of strings | - | Set the order of the requested records, by prefixing '-' on the column name you can get records by descending order. Comma separated list can also be provided. Example: `orderby=orderby=Name` |
| limit | integer | - | Set the limit of number of records in a request. Example: `limit=limit=10` |

### Responses

#### 200 - List all sites

**Response Schema:** `application/json`

Returns an array of site objects:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ID | integer | Yes | ID of the site |
| Name | string | Yes | Name of the site |

---

## Create a New Site

Creates a new site for a company.

### Endpoint
```
POST /api/v1.0/companies/{companyID}/sites/
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| companyID | integer | Yes | A build with Multi-company setup may have companyID >= 0, other builds use 0 by default. |

### Request Body Schema

**Content-Type:** `application/json`

**Required:** Yes

Site object with the following properties:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Name | string | Yes | Name of the site |
| Address | object | No | Address details |
| BillingAddress | object | No | Billing address details |
| BillingContact | string | No | Billing contact information |
| PrimaryContact | object | No | Primary contact details |
| PublicNotes | string | No | This column supports HTML formatting |
| PrivateNotes | string | No | This column supports HTML formatting |
| Zone | integer | No | ID of a zone |
| PreferredTechs | array of integers | No | Preferred technicians (Deprecated: Please use PreferredTechnicians which includes AssetType and ServiceLevel field) |
| Customers | array of integers | No | Associated customer IDs |
| Archived | boolean | No | Whether the site is archived |
| SITEZone | integer or null | No | Zone number for site location. Range: 1-5 |
| VEECZone | string or null | No | VEEC Zone for site location. Enum: `"Metropolitan"`, `"Regional"` |
| Rates | object | No | Rate information |

### Responses

#### 201 - Site created successfully

**Response Schema:** `application/json`

| Field | Type | Description |
|-------|------|-------------|
| ID | integer | ID of the site |
| Name | string | Name of the site |
| Address | object | Address details |
| BillingAddress | object | Billing address details |
| BillingContact | string | Billing contact information |
| PrimaryContact | object | Primary contact details |
| PublicNotes | string | This column supports HTML formatting |
| PrivateNotes | string | This column supports HTML formatting |
| Zone | object or null | Zone information |
| PreferredTechs | array of objects | Preferred technicians (Deprecated) |
| PreferredTechnicians | array of objects | Preferred technicians of a site |
| DateModified | string (date-time) | RFC3339 date-time format (e.g., 2018-05-21T19:53:39+10:00) |
| Customers | array of objects | Associated customers |
| Archived | boolean | Whether the site is archived |
| SITEZone | integer or null | Zone number for site location |
| VEECZone | string or null | VEEC Zone for site location |
| CustomFields | array of objects | All custom fields for this site |
| Rates | object | Rate information |

#### 422 - Body contains invalid data

---

## Retrieve Details for a Specific Site

Retrieves detailed information for a specific site.

### Endpoint
```
GET /api/v1.0/companies/{companyID}/sites/{siteID}
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| companyID | integer | Yes | A build with Multi-company setup may have companyID >= 0, other builds use 0 by default. |
| siteID | integer | Yes | A valid site ID. Example: 12345 |

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| columns | array of strings | When listing or searching a resource, specify which columns to be displayed. Example: `columns=columns=ID,Name` |

### Responses

#### 200 - Site details

**Response Schema:** `application/json`

| Field | Type | Description |
|-------|------|-------------|
| ID | integer | ID of the site |
| Name | string | Name of the site |
| Address | object | Address details |
| BillingAddress | object | Billing address details |
| BillingContact | string | Billing contact information |
| PrimaryContact | object | Primary contact details |
| PublicNotes | string | This column supports HTML formatting |
| PrivateNotes | string | This column supports HTML formatting |
| Zone | object or null | Zone information |
| PreferredTechs | array of objects | Preferred technicians (Deprecated: Please use PreferredTechnicians which includes AssetType and ServiceLevel field) |
| PreferredTechnicians | array of objects | Preferred technicians of a site. For modifications please use /preferredTechnicians endpoints |
| DateModified | string (date-time) | RFC3339 date-time format (e.g., 2018-05-21T19:53:39+10:00) |
| Customers | array of objects | Associated customers |
| Archived | boolean | Whether the site is archived |
| SITEZone | integer or null | Zone number for site location. Range: 1-5 |
| VEECZone | string or null | VEEC Zone for site location. Enum: `"Metropolitan"`, `"Regional"` |
| CustomFields | array of objects | All custom fields for this site |
| Rates | object | Rate information |

#### 422 - Body contains invalid data
---

## Search Sites by Address

Sites can be searched by the `Name` field using address normalization for better matching.

### Endpoint
```
GET /api/v1.0/companies/{companyID}/sites/?search=any&Name={normalizedAddress}
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| search | string | Yes | Set to `"any"` for partial matching |
| Name | string | Yes | Normalized address with wildcard. Example: `Name=7 Grace AV%` |

### Address Normalization

To improve matching accuracy, normalize the address by:
1. Extract street address (first part before comma)
2. Remove road type suffixes (RD, Road, ST, Street, Ave, Avenue, DR, Drive)
3. Trim whitespace
4. Add `%` wildcard for partial matching

**Transformation Logic:**
```javascript
// Input: "7 Grace AV, Tranmere, SA"
// Output: "7 Grace AV%"

const streetAddress = fullAddress.split(',')[0];
const normalizedAddress = streetAddress.replace(/\s+(RD|Road|ST|Street|Ave|Avenue|DR|Drive)$/i, '').trim() + '%';
```

**n8n Expression:**
```javascript
{{ $json.propertyAddress.split(',')[0].replace(/\s+(RD|Road|ST|Street|Ave|Avenue|DR|Drive)$/i, '').trim() }}%
```

### Example Request
```bash
GET /api/v1.0/companies/0/sites/?search=any&Name=7 Grace AV%
```

### Example Response (200 - Sites Found)
```json
[
  {
    "ID": 67890,
    "Name": "7 Grace AV, Tranmere, SA",
    "Address": {
      "Address": "7 Grace AV",
      "City": "Tranmere",
      "State": "SA",
      "Postcode": "5073"
    },
    "Customers": [
      {
        "ID": 12345,
        "CompanyName": "Nurton, Vicki"
      }
    ]
  }
]
```

### Empty Response (No Match)
```json
[]
```

### Workflow Logic
1. Extract street address from full address (before first comma)
2. Normalize by removing road type suffixes
3. Add `%` wildcard
4. Search using normalized address
5. If response is empty array `[]` → Site not found, create new site
6. If response contains results → Use existing site ID from first result

### Why Address Normalization?

Simpro may store addresses with different road type formats:
- **Stored**: `"7 Grace Road, Tranmere, SA"`
- **Incoming**: `"7 Grace RD, Tranmere, SA"`

By removing the suffix, both become `"7 Grace%"` and will match successfully.

**Note**: This search returns an array. Always check:
- Empty array `[]` = no match found
- Non-empty array = sites found (use first result's `ID`)
