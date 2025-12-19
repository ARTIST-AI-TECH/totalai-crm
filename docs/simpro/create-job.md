## SIMPRO: Create Job

**URL:**
```bash
https://platinumplumbinggassolutions.simprosuite.com/api/v1.0/companies/0/sites/
```
**POST**
```bash
/api/v1.0/companies/{companyID}/jobs/
```

**Path Parameters:**
- **companyID** (required) - Example `12345`. A build with Multi-company setup may have companyID >= 0, other builds use 0 by default.

**Request Body Schema**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Job Object",
  "type": "object",
  "required": [
    "Type",
    "Site"
  ],
  "properties": {
    "Type": {
      "type": "string",
      "enum": [
        "Project",
        "Service",
        "Prepaid"
      ]
    },
    "Site": {
      "type": "integer",
      "description": "ID of a site"
    },
    "Customer": {
      "type": "integer",
      "description": "ID of a customer"
    },
    "CustomerContract": {
      "type": "integer",
      "description": "ID of a customer contract"
    },
    "CustomerContact": {
      "type": "integer",
      "description": "ID of a contact"
    },
    "AdditionalContacts": {
      "type": "array",
      "items": {
        "type": "integer"
      },
      "description": "Array of integers"
    },
    "SiteContact": {
      "type": "integer",
      "description": "ID of a contact"
    },
    "OrderNo": {
      "type": "string"
    },
    "RequestNo": {
      "type": "string",
      "description": "This column refers to job name and it is deprecated."
    },
    "Name": {
      "type": "string"
    },
    "Description": {
      "type": "string",
      "description": "This column supports HTML formatting."
    },
    "Notes": {
      "type": "string",
      "description": "This column supports HTML formatting."
    },
    "DateIssued": {
      "type": "string",
      "format": "date",
      "description": "Date in YYYY-MM-DD format eg. 2021-04-22. Null dates can be filtered by Field=null or Field=ne(null)"
    },
    "DueDate": {
      "type": ["string", "null"],
      "format": "date",
      "description": "This field becomes mandatory when Mandatory Due Date setting for jobs is turned on in system setup defaults."
    },
    "DueTime": {
      "type": ["string", "null"],
      "pattern": "^((2[0-3]|1[0-9]|0[0-9]):([0-5][0-9]))$",
      "description": "Time in HH:MM format eg. 23:59"
    },
    "Tags": {
      "type": "array",
      "items": {
        "type": "integer"
      },
      "description": "Array of integers"
    },
    "Salesperson": {
      "type": "integer",
      "description": "ID of a staff"
    },
    "ProjectManager": {
      "type": "integer",
      "description": "ID of a staff"
    },
    "Technicians": {
      "type": "integer",
      "description": "ID of a staff"
    },
    "Technician": {
      "type": "integer",
      "description": "ID of a staff"
    },
    "Stage": {
      "type": "string",
      "enum": [
        "Pending",
        "Progress",
        "Complete",
        "Archived"
      ],
      "description": "Jobs progress through stages: from pending, to in progress, to complete, to invoiced. Once a completed job has been fully invoiced, its status will be set to invoiced."
    },
    "Status": {
      "type": "integer",
      "description": "ID of a project status code"
    },
    "ResponseTime": {
      "type": "integer",
      "description": "ID of a customer response time"
    },
    "AutoAdjustStatus": {
      "type": "boolean",
      "description": "Set this to false if you would like to set status manually."
    },
    "STC": {
      "type": "object"
    },
    "CompletedDate": {
      "type": ["string", "null"],
      "format": "date",
      "description": "Date in YYYY-MM-DD format eg. 2021-04-22. Null dates can be filtered by Field=null or Field=ne(null)"
    }
  }
}
```

***Response Schema 201***
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "ID": {
      "type": "integer",
      "description": "This job's ID"
    },
    "Type": {
      "type": "string",
      "enum": [
        "Project",
        "Service",
        "Prepaid"
      ]
    },
    "Customer": {
      "type": "object",
      "description": "Provide Customer ID or CustomerContract ID to create a new record"
    },
    "CustomerContract": {
      "type": "object",
      "description": "Provide Customer ID or CustomerContract ID to create a new record"
    },
    "CustomerContact": {
      "type": ["object", "null"]
    },
    "AdditionalContacts": {
      "type": "array",
      "items": {
        "type": "object"
      },
      "description": "Array of objects"
    },
    "Site": {
      "type": "object"
    },
    "SiteContact": {
      "type": ["object", "null"]
    },
    "OrderNo": {
      "type": "string"
    },
    "RequestNo": {
      "type": "string",
      "description": "This column refers to job name and it is deprecated."
    },
    "Name": {
      "type": "string"
    },
    "Description": {
      "type": "string",
      "description": "This column supports HTML formatting."
    },
    "Notes": {
      "type": "string",
      "description": "This column supports HTML formatting."
    },
    "DateIssued": {
      "type": "string",
      "format": "date",
      "description": "Date in YYYY-MM-DD format eg. 2021-04-22. Null dates can be filtered by Field=null or Field=ne(null)"
    },
    "DueDate": {
      "type": ["string", "null"],
      "format": "date",
      "description": "This field becomes mandatory when Mandatory Due Date setting for jobs is turned on in system setup defaults."
    },
    "DueTime": {
      "type": ["string", "null"],
      "pattern": "^((2[0-3]|1[0-9]|0[0-9]):([0-5][0-9]))$",
      "description": "Time in HH:MM format eg. 23:59"
    },
    "Tags": {
      "type": "array",
      "items": {
        "type": "object"
      },
      "description": "Array of objects"
    },
    "Salesperson": {
      "type": ["object", "null"]
    },
    "ProjectManager": {
      "type": ["object", "null"]
    },
    "Technicians": {
      "type": "array",
      "items": {
        "type": "object"
      },
      "description": "Array of objects"
    },
    "Technician": {
      "type": ["object", "null"],
      "description": "Deprecated: Revised field is technicians, please use Revised field"
    },
    "Stage": {
      "type": "string",
      "enum": [
        "Pending",
        "Progress",
        "Complete",
        "Invoiced",
        "Archived"
      ],
      "description": "Jobs progress through stages: from pending, to in progress, to complete, to invoiced. Once a completed job has been fully invoiced, its status will be set to invoiced."
    },
    "Status": {
      "type": "object",
      "description": "Set the current status of this job in your workflow. Please set AutoAdjustStatus to false if you wish to manage the status manually."
    },
    "ResponseTime": {
      "type": ["object", "null"]
    },
    "IsVariation": {
      "type": "boolean"
    },
    "LinkedVariations": {
      "type": "array",
      "items": {
        "type": "object"
      },
      "description": "Array of objects"
    },
    "ConvertedFromQuote": {
      "type": "object",
      "description": "Deprecated: Please use ConvertedFrom field."
    },
    "ConvertedFrom": {
      "type": "object",
      "description": "Converted from quote or recurring job information, null otherwise."
    },
    "DateModified": {
      "type": "string",
      "format": "date-time",
      "description": "RFC3339 date-time format eg. 2018-05-21T19:53:39+10:00. See https://tools.ietf.org/html/rfc3339#section-5.6"
    },
    "AutoAdjustStatus": {
      "type": "boolean",
      "description": "Set this to false if you would like to set status manually."
    },
    "IsRetentionEnabled": {
      "type": "boolean"
    },
    "Total": {
      "type": "object"
    },
    "Totals": {
      "type": "object"
    },
    "CustomFields": {
      "type": "array",
      "items": {
        "type": "object"
      },
      "description": "All of the custom fields for this job. See the custom fields handler for more information."
    },
    "STC": {
      "type": "object"
    },
    "CompletedDate": {
      "type": ["string", "null"],
      "format": "date",
      "description": "Date in YYYY-MM-DD format eg. 2021-04-22. Null dates can be filtered by Field=null or Field=ne(null)"
    }
  }
}
```

**Response Error**
- **422**: body contains invalid data

**Payload**
```json
{
  "Type": "Project",
  "Customer": 0,
  "CustomerContract": 0,
  "CustomerContact": 0,
  "AdditionalContacts": [
    0
  ],
  "Site": 0,
  "SiteContact": 0,
  "OrderNo": "string",
  "RequestNo": "string",
  "Name": "string",
  "Description": "Fault/Request See customer's email.",
  "Notes": "string",
  "DateIssued": "2021-04-22",
  "DueDate": "2021-04-22",
  "DueTime": "04:22",
  "Tags": [
    0
  ],
  "Salesperson": 0,
  "ProjectManager": 0,
  "Technicians": 0,
  "Technician": 0,
  "Stage": "Pending",
  "Status": 0,
  "ResponseTime": 0,
  "AutoAdjustStatus": true,
  "STC": {
    "STCsEligible": true,
    "VEECsEligible": true,
    "STCValue": 1.57,
    "VEECValue": 1.57
  },
  "CompletedDate": "2021-04-22"
}
```

