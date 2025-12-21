'use server';

import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { workOrders, activityLogs, ActivityType } from '@/lib/db/schema';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n-totalai-au.badou.ai/webhook/crm-trigger';
const DEFAULT_TEAM_ID = 1;

export async function triggerWorkOrderProcessing() {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    console.log('🎯 Triggering n8n workflow for user:', user.email);

    // Call n8n webhook directly (not through local API)
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        triggeredBy: user.email,
        triggeredAt: new Date().toISOString(),
        action: 'process_work_orders',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n webhook error:', response.status, errorText);
      return { success: false, error: `n8n webhook failed: ${response.status}` };
    }

    // Get work order data from n8n response
    const responseText = await response.text();
    console.log('📥 Raw response (first 200 chars):', responseText.substring(0, 200));

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.log('Response text:', responseText);
      throw new Error('Invalid JSON response from n8n');
    }

    console.log('✅ n8n workflow completed, received data');
    console.log('Response keys:', Object.keys(responseData));

    // Extract work orders array from response
    let workOrdersData = responseData.workorders || responseData.workOrders || responseData;

    // Check if workOrders is stringified
    if (typeof workOrdersData === 'string') {
      console.log('⚠️ workOrders is stringified, parsing...');
      workOrdersData = JSON.parse(workOrdersData);
    }

    // Handle both single object and array
    const workOrdersArray = Array.isArray(workOrdersData) ? workOrdersData : [workOrdersData];

    console.log(`📥 Received ${workOrdersArray.length} work orders`);
    if (workOrdersArray[0]) {
      console.log('First item keys:', Object.keys(workOrdersArray[0]));
      console.log('First item preview:', JSON.stringify(workOrdersArray[0], null, 2).substring(0, 500));
    }

    const savedWorkOrders = [];

    for (const workOrderItem of workOrdersArray) {
      // Unwrap n8n item structure (data is in .json property)
      const workOrderData = workOrderItem.json || workOrderItem;

      console.log('Processing:', workOrderData.externalId, 'Customer:', workOrderData.tenant?.name);
      // Save each work order to database
      const [savedWorkOrder] = await db
        .insert(workOrders)
        .values({
        teamId: DEFAULT_TEAM_ID,

        workOrderId: workOrderData.workOrderId || workOrderData.jobName || 'UNKNOWN',
        externalId: workOrderData.externalId || workOrderData.jobName || 'UNKNOWN',
        pmPlatform: workOrderData.pmPlatform || 'Tapi',

        simproJobId: parseInt(workOrderData.simpro?.jobId || workOrderData.jobId) || null,
        simproCustomerId: parseInt(workOrderData.simpro?.customerId || workOrderData.customerId?.ID) || null,
        simproCustomerName: workOrderData.simpro?.customerName || workOrderData.customerId?.CompanyName,
        simproSiteId: parseInt(workOrderData.simpro?.siteId || workOrderData.siteId?.ID) || null,
        simproSiteName: workOrderData.simpro?.siteName || workOrderData.siteId?.Name,
        simproStage: workOrderData.simpro?.stage || workOrderData.stage,
        simproJobUrl: (workOrderData.simpro?.jobId || workOrderData.jobId)
          ? `https://platinumplumbinggassolutions.simprosuite.com/staff/editProject.php?jobID=${workOrderData.simpro?.jobId || workOrderData.jobId}`
          : null,

        tenantName: workOrderData.tenant?.name || workOrderData.customer,
        tenantPhone: workOrderData.tenant?.phone || workOrderData.phone,
        tenantEmail: workOrderData.tenant?.email || workOrderData.email,

        pmName: workOrderData.propertyManager?.name || workOrderData.pmName,
        pmEmail: workOrderData.propertyManager?.email || workOrderData.pmEmail,

        propertyAddress: workOrderData.property?.address || workOrderData.address || 'Unknown',
        keyNumber: workOrderData.property?.keyNumber || workOrderData.keyNumber,

        issueTitle: workOrderData.issue?.title || workOrderData.issue || workOrderData.jobName || 'Unknown',
        issueDescription: workOrderData.issue?.description || workOrderData.issueDescription,
        priority: workOrderData.issue?.priority || workOrderData.priority || 'medium',

        status: (workOrderData.simpro?.jobId || workOrderData.jobId) ? 'job_created' : 'scraped',

        pdfFileName: workOrderData.attachments?.pdfFileName,
        simproAttachmentId: workOrderData.attachments?.pdfAttachmentId,

        receivedAt: new Date(),
        scrapedAt: new Date(),
        jobCreatedAt: workOrderData.createdJob?.DateModified ? new Date(workOrderData.createdJob.DateModified) : new Date(),

        rawData: workOrderData,
      })
      .returning();

      // Log activity for this work order
      await db.insert(activityLogs).values({
        teamId: DEFAULT_TEAM_ID,
        userId: user.id,
        action: ActivityType.WORK_ORDER_RECEIVED,
        timestamp: new Date(),
        ipAddress: 'manual-trigger',
      });

      console.log('✅ Work order saved:', savedWorkOrder.id, savedWorkOrder.externalId);
      savedWorkOrders.push(savedWorkOrder);
    }

    console.log(`✅ Processed ${savedWorkOrders.length} work orders`);

    return {
      success: true,
      count: savedWorkOrders.length,
      data: savedWorkOrders.map(wo => ({
        id: wo.id,
        workOrderId: wo.workOrderId,
        externalId: wo.externalId,
      })),
    };
  } catch (error) {
    console.error('❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

