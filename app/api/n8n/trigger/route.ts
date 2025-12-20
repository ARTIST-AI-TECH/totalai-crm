import { NextRequest } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { workOrders, activityLogs, ActivityType } from '@/lib/db/schema';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n-totalai-au.badou.ai/webhook/crm-trigger';
const N8N_WEBHOOK_TOKEN = process.env.N8N_WEBHOOK_TOKEN || 'dev-token-change-in-production';
const DEFAULT_TEAM_ID = 1;

export async function POST(req: NextRequest) {
  try {
    // 1. Validate user authentication
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🎯 Processing work orders requested by:', user.email);

    // 2. Trigger n8n webhook with auth token
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-n8n-auth-token': N8N_WEBHOOK_TOKEN,
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
      throw new Error(`n8n webhook failed: ${response.status} - ${errorText}`);
    }

    // 3. Get work order data from n8n response
    const workOrderData = await response.json();

    console.log('✅ n8n workflow completed');
    console.log('Response keys:', Object.keys(workOrderData));
    console.log('Full response:', JSON.stringify(workOrderData, null, 2));

    // 4. Save work order to database
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

        tenantName: workOrderData.tenant?.name || workOrderData.tenantName,
        tenantPhone: workOrderData.tenant?.phone || workOrderData.tenantPhone,
        tenantEmail: workOrderData.tenant?.email || workOrderData.tenantEmail,

        pmName: workOrderData.propertyManager?.name || workOrderData.pmName,
        pmEmail: workOrderData.propertyManager?.email || workOrderData.pmEmail,

        propertyAddress: workOrderData.property?.address || workOrderData.propertyAddress || 'Unknown Address',
        keyNumber: workOrderData.property?.keyNumber || workOrderData.keyNumber,

        issueTitle: workOrderData.issue?.title || workOrderData.issueTitle || workOrderData.jobName || 'Unknown Issue',
        issueDescription: workOrderData.issue?.description || workOrderData.issueDescription,
        priority: workOrderData.issue?.priority || workOrderData.priority || 'medium',

        status: (workOrderData.simpro?.jobId || workOrderData.jobId) ? 'job_created' : 'scraped',

        pdfFileName: workOrderData.attachments?.pdfFileName || workOrderData.pdfFileName,
        simproAttachmentId: workOrderData.attachments?.pdfAttachmentId || workOrderData.pdfAttachmentId,

        receivedAt: workOrderData.timestamps?.receivedAt
          ? new Date(workOrderData.timestamps.receivedAt)
          : new Date(),
        scrapedAt: workOrderData.timestamps?.scrapedAt
          ? new Date(workOrderData.timestamps.scrapedAt)
          : new Date(),
        jobCreatedAt: workOrderData.timestamps?.jobCreatedAt
          ? new Date(workOrderData.timestamps.jobCreatedAt)
          : (workOrderData.createdJob?.DateModified ? new Date(workOrderData.createdJob.DateModified) : new Date()),

        rawData: workOrderData,
      })
      .returning();

    // 5. Log activity
    await db.insert(activityLogs).values({
      teamId: DEFAULT_TEAM_ID,
      userId: user.id,
      action: ActivityType.WORK_ORDER_RECEIVED,
      timestamp: new Date(),
      ipAddress: req.headers.get('x-forwarded-for') || 'manual-trigger',
    });

    console.log('✅ Work order saved to database:', savedWorkOrder.id);

    // 6. Return success
    return Response.json({
      success: true,
      message: 'Work order processed successfully',
      workOrder: {
        id: savedWorkOrder.id,
        workOrderId: savedWorkOrder.workOrderId,
        externalId: savedWorkOrder.externalId,
      },
    });
  } catch (error) {
    console.error('❌ Error processing work orders:', error);
    return Response.json(
      {
        error: 'Failed to trigger workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

