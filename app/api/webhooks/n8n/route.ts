import { NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { workOrders, activityLogs, ActivityType } from '@/lib/db/schema';

const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || 'dev-secret-change-in-production';
const DEFAULT_TEAM_ID = 1; // Platinum Plumbing team

export async function POST(req: NextRequest) {
  try {
    // 1. Validate webhook secret
    const authHeader = req.headers.get('x-crm-webhook-secret');
    if (authHeader !== WEBHOOK_SECRET) {
      console.error('Unauthorized webhook attempt');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse payload
    const payload = await req.json();

    console.log('📥 Webhook received:', {
      workOrderId: payload.workOrderId,
      externalId: payload.externalId,
      simproJobId: payload.simpro?.jobId
    });

    // 3. Insert work order
    const [workOrder] = await db
      .insert(workOrders)
      .values({
        teamId: DEFAULT_TEAM_ID,

        // Work Order Identity
        workOrderId: payload.workOrderId,
        externalId: payload.externalId,
        pmPlatform: payload.pmPlatform,

        // Simpro Data
        simproJobId: payload.simpro?.jobId,
        simproCustomerId: payload.simpro?.customerId,
        simproCustomerName: payload.simpro?.customerName,
        simproSiteId: payload.simpro?.siteId,
        simproSiteName: payload.simpro?.siteName,
        simproStage: payload.simpro?.stage,
        simproJobUrl: payload.simpro?.jobId
          ? `https://platinumplumbinggassolutions.simprosuite.com/job/${payload.simpro.jobId}`
          : null,

        // Tenant Information
        tenantName: payload.tenant?.name,
        tenantPhone: payload.tenant?.phone,
        tenantEmail: payload.tenant?.email,

        // Property Manager
        pmName: payload.propertyManager?.name,
        pmEmail: payload.propertyManager?.email,

        // Property Details
        propertyAddress: payload.property?.address,
        keyNumber: payload.property?.keyNumber,

        // Issue Details
        issueTitle: payload.issue?.title,
        issueDescription: payload.issue?.description,
        priority: payload.issue?.priority,

        // Status
        status: payload.simpro?.jobId ? 'job_created' : 'scraped',

        // Attachments
        pdfFileName: payload.attachments?.pdfFileName,
        simproAttachmentId: payload.attachments?.pdfAttachmentId,

        // Email Metadata
        emailSender: payload.email?.sender,
        emailSubject: payload.email?.subject,
        emailMessageId: payload.email?.messageId,
        sourceUrl: payload.sourceUrl,

        // Timestamps
        receivedAt: payload.timestamps?.receivedAt
          ? new Date(payload.timestamps.receivedAt)
          : new Date(),
        scrapedAt: payload.timestamps?.scrapedAt
          ? new Date(payload.timestamps.scrapedAt)
          : null,
        jobCreatedAt: payload.timestamps?.jobCreatedAt
          ? new Date(payload.timestamps.jobCreatedAt)
          : null,

        // Metadata
        rawData: payload,
      })
      .returning();

    // 4. Log activity
    await db.insert(activityLogs).values({
      teamId: DEFAULT_TEAM_ID,
      userId: null, // System action
      action: ActivityType.WORK_ORDER_RECEIVED,
      timestamp: new Date(),
      ipAddress: req.headers.get('x-forwarded-for') || 'n8n-webhook',
    });

    console.log('✅ Work order saved:', {
      id: workOrder.id,
      workOrderId: workOrder.workOrderId,
      externalId: workOrder.externalId
    });

    // 5. Return success
    return Response.json(
      {
        success: true,
        workOrderId: workOrder.id,
        externalId: workOrder.externalId,
        message: 'Work order received and stored',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Webhook error:', error);

    // Log error activity
    try {
      await db.insert(activityLogs).values({
        teamId: DEFAULT_TEAM_ID,
        userId: null,
        action: ActivityType.WEBHOOK_ERROR,
        timestamp: new Date(),
        ipAddress: req.headers.get('x-forwarded-for') || 'n8n-webhook',
      });
    } catch (logError) {
      console.error('Failed to log error activity:', logError);
    }

    return Response.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
