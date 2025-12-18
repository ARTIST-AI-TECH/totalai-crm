# CREATE A NEW JOB

```bash
/api/v1.0/companies/{companyID}/jobs/
```

## Payload

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

## Response Sample

```json
{
  "ID": 12345,
  "Type": "Project",
  "Customer": {
    "ID": 12345,
    "CompanyName": "John Smith Pty Ltd",
    "GivenName": "John",
    "FamilyName": "Smith"
  },
  "CustomerContract": {
    "ID": 0,
    "Name": "string",
    "StartDate": "2021-04-22",
    "EndDate": "2021-04-22",
    "ContractNo": "string"
  },
  "CustomerContact": {
    "ID": 0,
    "GivenName": "string",
    "FamilyName": "string"
  },
  "AdditionalContacts": [
    {
      "ID": 0,
      "GivenName": "string",
      "FamilyName": "string"
    }
  ],
  "Site": {
    "ID": 12345,
    "Name": "string"
  },
  "SiteContact": {
    "ID": 0,
    "GivenName": "string",
    "FamilyName": "string"
  },
  "OrderNo": "string",
  "RequestNo": "string",
  "Name": "string",
  "Description": "Fault/Request See customer's email.",
  "Notes": "string",
  "DateIssued": "2021-04-22",
  "DueDate": "2021-04-22",
  "DueTime": "04:22",
  "Tags": [
    {
      "ID": 12345,
      "Name": "string"
    }
  ],
  "Salesperson": {
    "ID": 123,
    "Name": "John Smith",
    "Type": "employee",
    "TypeId": 0
  },
  "ProjectManager": {
    "ID": 123,
    "Name": "John Smith",
    "Type": "employee",
    "TypeId": 0
  },
  "Technicians": [
    {
      "ID": 123,
      "Name": "John Smith",
      "Type": "employee",
      "TypeId": 0
    }
  ],
  "Technician": {
    "ID": 123,
    "Name": "John Smith",
    "Type": "employee",
    "TypeId": 0
  },
  "Stage": "Pending",
  "Status": {
    "ID": 12345,
    "Name": "Sales: In-Progress",
    "Color": "#0000FF"
  },
  "ResponseTime": {
    "ID": 0,
    "Name": "string",
    "Days": 0,
    "Hours": 0,
    "Minutes": 0
  },
  "IsVariation": true,
  "LinkedVariations": [
    {
      "ID": 12345,
      "Description": "Fault/Request See customer's email.",
      "Total": {
        "ExTax": 1.57,
        "Tax": 1.57,
        "IncTax": 1.57
      }
    }
  ],
  "ConvertedFromQuote": {
    "ID": 0,
    "Description": "string",
    "Total": {
      "ExTax": 1.57,
      "Tax": 1.57,
      "IncTax": 1.57
    }
  },
  "ConvertedFrom": {
    "ID": 12345,
    "Type": "Quote",
    "Date": "2019-09-19T19:53:39+10:00"
  },
  "DateModified": "2018-05-21T19:53:39+10:00",
  "AutoAdjustStatus": true,
  "IsRetentionEnabled": true,
  "Total": {
    "ExTax": 1.57,
    "Tax": 1.57,
    "IncTax": 1.57
  },
  "Totals": {
    "MaterialsCost": {
      "Actual": 1.57,
      "Committed": 1.57,
      "Estimate": 1.57,
      "Revised": 1.57,
      "Revized": 1.57
    },
    "ResourcesCost": {
      "Total": {
        "Actual": 1.57,
        "Committed": 1.57,
        "Estimate": 1.57,
        "Revised": 1.57,
        "Revized": 1.57
      },
      "Labor": {
        "Actual": 1.57,
        "Committed": 1.57,
        "Estimate": 1.57,
        "Revised": 1.57,
        "Revized": 1.57
      },
      "LaborHours": {
        "Actual": 1.57,
        "Committed": 1.57,
        "Estimate": 1.57,
        "Revised": 1.57,
        "Revized": 1.57
      },
      "PlantAndEquipment": {
        "Actual": 1.57,
        "Committed": 1.57,
        "Estimate": 1.57,
        "Revised": 1.57,
        "Revized": 1.57
      },
      "PlantAndEquipmentHours": {
        "Actual": 1.57,
        "Estimate": 1.57,
        "Revised": 1.57,
        "Revized": 1.57
      },
      "Commission": {
        "Actual": 1.57,
        "Estimate": 1.57,
        "Revised": 1.57
      },
      "Overhead": {
        "Actual": 1.57,
        "Committed": 1.57,
        "Estimate": 1.57,
        "Revised": 1.57,
        "Revized": 1.57
      }
    },
    "MaterialsMarkup": {
      "Actual": 1.57,
      "Estimate": 1.57,
      "Revised": 1.57,
      "Revized": 1.57
    },
    "ResourcesMarkup": {
      "Total": {
        "Actual": 1.57,
        "Estimate": 1.57,
        "Revised": 1.57,
        "Revized": 1.57
      },
      "Labor": {
        "Actual": 1.57,
        "Estimate": 1.57,
        "Revised": 1.57,
        "Revized": 1.57
      },
      "PlantAndEquipment": {
        "Actual": 1.57,
        "Estimate": 1.57,
        "Revised": 1.57,
        "Revized": 1.57
      }
    },
    "Adjusted": {
      "Actual": 1.57,
      "Estimate": 1.57,
      "Revised": 1.57,
      "Revized": 1.57
    },
    "MembershipDiscount": 1.57,
    "Discount": 1.57,
    "STCs": 1.57,
    "VEECs": 1.57,
    "GrossProfitLoss": {
      "Actual": 1.57,
      "Estimate": 1.57,
      "Revised": 1.57,
      "Revized": 1.57
    },
    "GrossMargin": {
      "Actual": 1.57,
      "Estimate": 1.57,
      "Revised": 1.57,
      "Revized": 1.57
    },
    "NettProfitLoss": {
      "Actual": 1.57,
      "Estimate": 1.57,
      "Revised": 1.57,
      "Revized": 1.57
    },
    "NettMargin": {
      "Actual": 1.57,
      "Estimate": 1.57,
      "Revised": 1.57,
      "Revized": 1.57
    },
    "InvoicedValue": 1.57,
    "InvoicePercentage": 1.57
  },
  "CustomFields": [
    {
      "CustomField": {
        "ID": 12345,
        "Name": "string",
        "Type": "List",
        "ListItems": [
          "string"
        ],
        "IsMandatory": true
      },
      "Value": "string"
    }
  ],
  "STC": {
    "STCsEligible": true,
    "VEECsEligible": true,
    "STCValue": 1.57,
    "VEECValue": 1.57
  },
  "CompletedDate": "2021-04-22"
}
```

## CREATE A NEW JOB ATTACHMENT.

### PATH PARAMETERS

| companyID | required| integer| Example: 12345

```bash
/api/v1.0/companies/{companyID}/jobs/{jobID}/attachments/files/
```

A build with Multi-company setup may have companyID >= 0, other builds use 0 by default.
For more information about Multi-company, see:
https://helpguide.simprogroup.com/Content/Service-and-Enterprise/Multi-company.htm
jobID
required
integer
Example: 12345
A valid job id
REQUEST BODY SCHEMA: application/json
required

Job attachment object
Filename
required
string
Base64Data
required
string <byte>
Base 64 encoded file content. Use parameter ?display=Base64 in the URL inorder to get Base64 data as part of the response of GET Request.
Folder	
integer
ID of a job attachment folder
Public	
boolean
When Public is set to true, the attachment will be available in the Customer Portal.
Email	
boolean
When Email is set to true, the attachment will be available in the forms tab on simPRO web UI.
RESPONSES

201 Job attachment created successfully.
RESPONSE SCHEMA: application/json

ID	
string
Filename	
string
Folder	
object or null
Public	
boolean
When Public is set to true, the attachment will be available in the Customer Portal.
Email	
boolean
When Email is set to true, the attachment will be available in the forms tab on simPRO web UI.
MimeType	
string
Attachment mine type. (Read Only)
FileSizeBytes	
integer
Attachment size in bytes. (Read Only)
DateAdded	
string <date-time>
RFC3339 date-time format eg. 2018-05-21T19:53:39+10:00. See https://tools.ietf.org/html/rfc3339#section-5.6
AddedBy	
object or null
Employee uploading the attachment.
422 body contains invalid data.