const items = $input.all();

return items.map(item => {
  const prep = JSON.parse(item.json.Prep_data_for_work_order_) || item.json;

  return {
    json: {
      workOrderId: prep.workOrderId,
      externalId: prep.externalId,
      pmPlatform: prep.pmPlatform,

      tenant: {
        name: prep.customer,
        phone: prep.phone,
        email: prep.email
      },

      property: {
        address: prep.address,
        keyNumber: prep.keyNumber
      },

      issue: {
        title: prep.issue,
        description: prep.issueDescription,
        priority: prep.priority
      },

      propertyManager: {
        name: prep.pmName,
        email: prep.pmEmail
      },

      simpro: {
        jobId: item.json.ID || item.json.jobId,
        customerId: item.json.Customer_ID,
        customerName: item.json.Customer_CompanyName,
        siteId: item.json.Site_ID,
        siteName: item.json.Site_Name,
        stage: item.json.Stage
      },

      attachments: {
        pdfFileName: prep.pdfFileName,
        pdfAttachmentId: item.json._Attach_PDF_to_Job_ID
      },

      timestamps: {
        receivedAt: prep.receivedAt,
        scrapedAt: new Date().toISOString(),
        jobCreatedAt: item.json.DateModified
      },

      acceptance: item.json.acceptance ? JSON.parse(item.json.acceptance) : { accepted: false, acceptedAt: null }
    }
  };
});
