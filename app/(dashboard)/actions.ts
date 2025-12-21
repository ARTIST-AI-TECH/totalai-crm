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
    const responseData = await response.json();

    console.log('✅ n8n workflow completed, received data');

    // Handle both single object and array of work orders
    const workOrdersArray = Array.isArray(responseData) ? responseData : [responseData];
    const savedWorkOrders = [];

    console.log(`📥 Received ${workOrdersArray.length} work orders from n8n`);

    for (const workOrderData of workOrdersArray) {
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

        tenantName: workOrderData.tenant?.name,
        tenantPhone: workOrderData.tenant?.phone,
        tenantEmail: workOrderData.tenant?.email,

        pmName: workOrderData.propertyManager?.name,
        pmEmail: workOrderData.propertyManager?.email,

        propertyAddress: workOrderData.property?.address || workOrderData.propertyAddress || 'Unknown',
        keyNumber: workOrderData.property?.keyNumber,

        issueTitle: workOrderData.issue?.title || workOrderData.jobName || 'Unknown',
        issueDescription: workOrderData.issue?.description,
        priority: workOrderData.issue?.priority || 'medium',

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

