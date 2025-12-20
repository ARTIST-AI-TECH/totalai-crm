## Actual Payload
```json
[
  {
    "ID": 54448,
    "Type": "Service",
    "Customer": {
      "ID": 3370,
      "CompanyName": "Harris Property Management - Kent Town",
      "GivenName": "",
      "FamilyName": ""
    },
    "CustomerContract": {
      "ID": 3369,
      "Name": "Harris Property Management - Kent Town",
      "StartDate": "",
      "EndDate": "",
      "ContractNo": ""
    },
    "CustomerContact": null,
    "AdditionalContacts": [],
    "Site": {
      "ID": 23231,
      "Name": "366 Portrush Road, Tusmore"
    },
    "SiteContact": null,
    "OrderNo": "",
    "RequestNo": "TAPI-002630 - BLOCKED TOILET",
    "Name": "TAPI-002630 - BLOCKED TOILET",
    "Description": "<div style=\"font-size: 10pt;\">Morning,\n\nWe have an issue with the ensuite toilet over the weekend with the toilet blocked and the water bubbling. The other toilets are fine at the moment.\n\nPlease call Maria for access</div>",
    "Notes": "<div style=\"font-size: 10pt;\">Property Manager: Alex Gangnuzs (alex.gangnuzs@harrisre.com.au)\nTenant: Maria Atsikbasis (0422 844 904)\nKey Number: A1856\nSubmitted: 2025-11-30T23:35:56.953000</div>",
    "DateIssued": "2025-12-20",
    "DueDate": null,
    "DueTime": null,
    "Tags": [],
    "Salesperson": null,
    "ProjectManager": null,
    "Technicians": [],
    "Technician": null,
    "Stage": "Pending",
    "Status": {
      "ID": 10,
      "Name": "Job : In Progress",
      "Color": "#4ca6ff"
    },
    "ResponseTime": {},
    "IsVariation": false,
    "LinkedVariations": [],
    "ConvertedFromQuote": null,
    "ConvertedFrom": null,
    "DateModified": "2025-12-20T22:05:21+10:30",
    "AutoAdjustStatus": true,
    "IsRetentionEnabled": false,
    "Total": {
      "ExTax": 0,
      "Tax": 0,
      "IncTax": 0
    },
    "Totals": {
      "MaterialsCost": {
        "Actual": 0,
        "Committed": 0,
        "Estimate": 0,
        "Revised": 0,
        "Revized": 0
      },
      "ResourcesCost": {
        "Total": {
          "Actual": 0,
          "Committed": 0,
          "Estimate": 0,
          "Revised": 0,
          "Revized": 0
        },
        "Labor": {
          "Actual": 0,
          "Committed": 0,
          "Estimate": 0,
          "Revised": 0,
          "Revized": 0
        },
        "LaborHours": {
          "Actual": 0,
          "Committed": 0,
          "Estimate": 0,
          "Revised": 0,
          "Revized": 0
        },
        "PlantAndEquipment": {
          "Actual": 0,
          "Committed": 0,
          "Estimate": 0,
          "Revised": 0,
          "Revized": 0
        },
        "PlantAndEquipmentHours": {
          "Actual": 0,
          "Estimate": 0,
          "Revised": 0,
          "Revized": 0
        },
        "Commission": {
          "Actual": 0,
          "Estimate": 0,
          "Revised": 0
        },
        "Overhead": {
          "Actual": 0,
          "Committed": 0,
          "Estimate": 0,
          "Revised": 0,
          "Revized": 0
        }
      },
      "MaterialsMarkup": {
        "Actual": 0,
        "Estimate": 0,
        "Revised": 0,
        "Revized": 0
      },
      "ResourcesMarkup": {
        "Total": {
          "Actual": 0,
          "Estimate": 0,
          "Revised": 0,
          "Revized": 0
        },
        "Labor": {
          "Actual": 0,
          "Estimate": 0,
          "Revised": 0,
          "Revized": 0
        },
        "PlantAndEquipment": {
          "Actual": 0,
          "Estimate": 0,
          "Revised": 0,
          "Revized": 0
        }
      },
      "Adjusted": {
        "Actual": 0,
        "Estimate": 0,
        "Revised": 0,
        "Revized": 0
      },
      "MembershipDiscount": 0,
      "Discount": 0,
      "STCs": 0,
      "VEECs": 0,
      "GrossProfitLoss": {
        "Actual": 0,
        "Estimate": 0,
        "Revised": 0,
        "Revized": 0
      },
      "GrossMargin": {
        "Actual": 0,
        "Estimate": 0,
        "Revised": 0,
        "Revized": 0
      },
      "NettProfitLoss": {
        "Actual": 0,
        "Estimate": 0,
        "Revised": 0,
        "Revized": 0
      },
      "NettMargin": {
        "Actual": 0,
        "Estimate": 0,
        "Revised": 0,
        "Revized": 0
      },
      "InvoicedValue": 0,
      "InvoicePercentage": 0
    },
    "CustomFields": [],
    "STC": {
      "STCsEligible": false,
      "VEECsEligible": false,
      "STCValue": 0,
      "VEECValue": 0
    },
    "CompletedDate": null
  }
]
```

## Additional data from earlier nodes

**Build Job Payload**
```json
[
  {
    "jobPayload": {
      "Type": "Service",
      "Customer": 3370,
      "Site": 23231,
      "Name": "TAPI-002630 - BLOCKED TOILET",
      "Description": "Morning,\n\nWe have an issue with the ensuite toilet over the weekend with the toilet blocked and the water bubbling. The other toilets are fine at the moment.\n\nPlease call Maria for access",
      "Notes": "Property Manager: Alex Gangnuzs (alex.gangnuzs@harrisre.com.au)\nTenant: Maria Atsikbasis (0422 844 904)\nKey Number: A1856\nSubmitted: 2025-11-30T23:35:56.953000",
      "DateIssued": "2025-12-20",
      "Stage": "Pending",
      "AutoAdjustStatus": true
    },
    "customerId": 3370,
    "customerName": "Harris Property Management - Kent Town",
    "customerSource": "site",
    "siteId": 23231,
    "siteName": "366 Portrush Road, Tusmore",
    "siteFound": true,
    "workOrderId": "WO-2025-301149",
    "externalId": "TAPI-002630",
    "pdfFileName": "TAPI-002630_work_order.pdf",
    "hasPDF": true,
    "ready": true,
    "_raw": {
      "workOrderId": "WO-2025-301149",
      "externalId": "TAPI-002630",
      "customer": "Maria Atsikbasis",
      "phone": "0422 844 904",
      "email": "conmar@internode.on.net",
      "address": "366 Portrush RD, Tusmore, SA",
      "keyNumber": "A1856",
      "issue": "BLOCKED TOILET",
      "issueDescription": "Morning,\n\nWe have an issue with the ensuite toilet over the weekend with the toilet blocked and the water bubbling. The other toilets are fine at the moment.\n\nPlease call Maria for access",
      "priority": "high",
      "pmName": "Alex Gangnuzs",
      "pmEmail": "alex.gangnuzs@harrisre.com.au",
      "submittedDate": "2025-11-30T23:35:56.953000",
      "receivedAt": "2025-11-30T23:38:21Z",
      "pmPlatform": "Tapi",
      "sourceUrl": "https://url6277.tapihq.com/ls/click?upn=u001.FDrmjlsXkL15ZRyTjPZRcNiyfL8fPv6RIRdPb192n-2Bpa9f29r7aPYzv1SHtM7Af-2Fs0P2VnD7-2Bo0-2BV8dSHNjXoFA3ZYKBnp9UedpmNyuoLnkQ5KCmVd2Oy1SZhTOF2pSIX6VN7-2BfPrnpyecjs7gfHs31rwaNL-2BLTe5wJeHYb5hHI-3DPrTq_A3nRQoop3xGTTNLdbAlLJUXV19H0LGneCDRBv8lOjGKb-2BclI-2FqQArVfgTVTv8ELCNG-2FwMklYAstRXOcTBtJX3n00B8Aq89mzYgf1cmkAQUCcaw06Wwm9aylg28UGPCcaMHW4BhgW94WjEQPDhr0qacqadxM4M9aX2Pd-2BggN48OWylylcp3-2FLCY6cCuusSAXt2smahxXJ3eM4lancF3JLQwZskUE6Ckd0dNKMNJto454-3D",
      "emailSender": "hi@tapihq.com",
      "emailSubject": "New work order at 366 Portrush RD, Tusmore, SA",
      "messageId": "AAMkAGRkM2RhOTE1LWNkNzItNDM3YS1iZjk0LTQ4NWZjMmEzZmU3MgBGAAAAAABVjyXmZosRQ6Wd5CXjG0QNBwD_Bp2oFRZiTJdtfivaO12qAAAAAAEMAACW6w32vYJKSZnp_L84y_d2AAf0xiJuAAA=",
      "pdfFileName": "TAPI-002630_work_order.pdf",
      "hasPDF": true,
      "_extracted": {
        "workOrderId": "TAPI-002630",
        "issueTitle": "BLOCKED TOILET",
        "issueDescription": "Morning,\n\nWe have an issue with the ensuite toilet over the weekend with the toilet blocked and the water bubbling. The other toilets are fine at the moment.\n\nPlease call Maria for access",
        "propertyAddress": "366 Portrush RD, Tusmore, SA",
        "tenantName": "Maria Atsikbasis",
        "tenantPhone": "0422 844 904",
        "tenantEmail": "conmar@internode.on.net",
        "propertyManagerName": "Alex Gangnuzs",
        "propertyManagerEmail": "alex.gangnuzs@harrisre.com.au",
        "submittedDate": "2025-11-30T23:35:56.953000",
        "keyNumber": "A1856"
      }
    }
  }
]
```

**Prep data for work order**
```json
[
  {
    "workOrderId": "WO-2025-346686",
    "externalId": "TAPI-002630",
    "customer": "Maria Atsikbasis",
    "phone": "0422 844 904",
    "email": "conmar@internode.on.net",
    "address": "366 Portrush RD, Tusmore, SA",
    "keyNumber": "A1856",
    "issue": "BLOCKED TOILET",
    "issueDescription": "Morning,\n\nWe have an issue with the ensuite toilet over the weekend with the toilet blocked and the water bubbling. The other toilets are fine at the moment.\n\nPlease call Maria for access",
    "priority": "high",
    "pmName": "Alex Gangnuzs",
    "pmEmail": "alex.gangnuzs@harrisre.com.au",
    "submittedDate": "2025-11-30T23:35:56.953000",
    "receivedAt": "2025-11-30T23:38:21Z",
    "pmPlatform": "Tapi",
    "sourceUrl": "https://url6277.tapihq.com/ls/click?upn=u001.FDrmjlsXkL15ZRyTjPZRcNiyfL8fPv6RIRdPb192n-2Bpa9f29r7aPYzv1SHtM7Af-2Fs0P2VnD7-2Bo0-2BV8dSHNjXoFA3ZYKBnp9UedpmNyuoLnkQ5KCmVd2Oy1SZhTOF2pSIX6VN7-2BfPrnpyecjs7gfHs31rwaNL-2BLTe5wJeHYb5hHI-3DPrTq_A3nRQoop3xGTTNLdbAlLJUXV19H0LGneCDRBv8lOjGKb-2BclI-2FqQArVfgTVTv8ELCNG-2FwMklYAstRXOcTBtJX3n00B8Aq89mzYgf1cmkAQUCcaw06Wwm9aylg28UGPCcaMHW4BhgW94WjEQPDhr0qacqadxM4M9aX2Pd-2BggN48OWylylcp3-2FLCY6cCuusSAXt2smahxXJ3eM4lancF3JLQwZskUE6Ckd0dNKMNJto454-3D",
    "emailSender": "hi@tapihq.com",
    "emailSubject": "New work order at 366 Portrush RD, Tusmore, SA",
    "messageId": "AAMkAGRkM2RhOTE1LWNkNzItNDM3YS1iZjk0LTQ4NWZjMmEzZmU3MgBGAAAAAABVjyXmZosRQ6Wd5CXjG0QNBwD_Bp2oFRZiTJdtfivaO12qAAAAAAEMAACW6w32vYJKSZnp_L84y_d2AAf0xiJuAAA=",
    "pdfFileName": "TAPI-002630.pdf",
    "hasPDF": true,
    "_extracted": {
      "workOrderId": "TAPI-002630",
      "issueTitle": "BLOCKED TOILET",
      "issueDescription": "Morning,\n\nWe have an issue with the ensuite toilet over the weekend with the toilet blocked and the water bubbling. The other toilets are fine at the moment.\n\nPlease call Maria for access",
      "propertyAddress": "366 Portrush RD, Tusmore, SA",
      "tenantName": "Maria Atsikbasis",
      "tenantPhone": "0422 844 904",
      "tenantEmail": "conmar@internode.on.net",
      "propertyManagerName": "Alex Gangnuzs",
      "propertyManagerEmail": "alex.gangnuzs@harrisre.com.au",
      "submittedDate": "2025-11-30T23:35:56.953000",
      "keyNumber": "A1856"
    }
  }
]
```