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
    const workOrderData = await response.json();

    console.log('✅ n8n workflow completed, received data');

    // Save work order to database
    const [savedWorkOrder] = await db
      .insert(workOrders)
      .values({
        teamId: DEFAULT_TEAM_ID,

        workOrderId: workOrderData.workOrderId || workOrderData.jobName || 'UNKNOWN',
        externalId: workOrderData.externalId || workOrderData.jobName || 'UNKNOWN',
        pmPlatform: workOrderData.pmPlatform || 'Tapi',

        simproJobId: workOrderData.simpro?.jobId || workOrderData.jobId,
        simproCustomerId: workOrderData.simpro?.customerId || workOrderData.customerId?.ID,
        simproCustomerName: workOrderData.simpro?.customerName || workOrderData.customerId?.CompanyName,
        simproSiteId: workOrderData.simpro?.siteId || workOrderData.siteId?.ID,
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

    // Log activity
    await db.insert(activityLogs).values({
      teamId: DEFAULT_TEAM_ID,
      userId: user.id,
      action: ActivityType.WORK_ORDER_RECEIVED,
      timestamp: new Date(),
      ipAddress: 'manual-trigger',
    });

    console.log('✅ Work order saved:', savedWorkOrder.id);

    return {
      success: true,
      data: {
        id: savedWorkOrder.id,
        workOrderId: savedWorkOrder.workOrderId,
        externalId: savedWorkOrder.externalId,
      },
    };
  } catch (error) {
    console.error('❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

