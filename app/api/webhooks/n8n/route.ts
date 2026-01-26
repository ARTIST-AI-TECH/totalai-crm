import { NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { workOrders, activityLogs, ActivityType } from '@/lib/db/schema';

const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || 'dev-secret-change-in-production';
const DEFAULT_TEAM_ID = 1; // Platinum Plumbing team

export async function POST(req: NextRequest) {
  try {
    // 1. Validate webhook secret
    const authHeader = req.headers.get('x-crm-webhook-secret');

    // Debug logging
    console.log('🔐 Auth Debug:', {
      receivedHeader: authHeader?.substring(0, 20) + '...',
      expectedSecret: WEBHOOK_SECRET?.substring(0, 20) + '...',
      envVarExists: !!process.env.N8N_WEBHOOK_SECRET,
      match: authHeader === WEBHOOK_SECRET
    });

    if (authHeader !== WEBHOOK_SECRET) {
      console.error('Unauthorized webhook attempt');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse payload
    let payload = await req.json();

    // Unwrap if data is nested in JSON property (from n8n)
    if (payload.JSON && typeof payload.JSON === 'object') {
      payload = payload.JSON;
    }

    console.log('📥 Webhook received:', {
      workOrderId: payload.workOrderId,
      externalId: payload.externalId,
      simproJobId: payload.simpro?.jobId
    });

    // 3. Check for duplicate by externalId
    const existingWorkOrder = await db.query.workOrders.findFirst({
      where: (workOrders, { eq }) => eq(workOrders.externalId, payload.externalId),
    });

    if (existingWorkOrder) {
      console.log(`⚠️ Duplicate work order: ${payload.externalId} (ID: ${existingWorkOrder.id})`);
      return Response.json(
        {
          success: true,
          duplicate: true,
          workOrderId: existingWorkOrder.id,
          externalId: existingWorkOrder.externalId,
          message: 'Work order already exists',
        },
        { status: 200 }
      );
    }

    // 4. Insert work order
    const [workOrder] = await db
      .insert(workOrders)
      .values({
        teamId: DEFAULT_TEAM_ID,

        // Work Order Identity
        workOrderId: payload.workOrderId,
        externalId: payload.externalId,
        pmPlatform: payload.pmPlatform,

        // Simpro Data (parse string IDs to integers)
        simproJobId: payload.simpro?.jobId
          ? (typeof payload.simpro.jobId === 'string' ? parseInt(payload.simpro.jobId) : payload.simpro.jobId)
          : null,
        simproCustomerId: payload.simpro?.customerId
          ? (typeof payload.simpro.customerId === 'string' ? parseInt(payload.simpro.customerId) : payload.simpro.customerId)
          : null,
        simproCustomerName: payload.simpro?.customerName || null,
        simproSiteId: payload.simpro?.siteId
          ? (typeof payload.simpro.siteId === 'string' ? parseInt(payload.simpro.siteId) : payload.simpro.siteId)
          : null,
        simproSiteName: payload.simpro?.siteName || null,
        simproStage: payload.simpro?.stage || null,
        simproJobUrl: payload.simpro?.jobId
          ? `https://platinumplumbinggassolutions.simprosuite.com/staff/editProject.php?jobID=${payload.simpro.jobId}`
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

        // Email Metadata (fallback to smsDetails if email object missing)
        emailSender: payload.email?.sender || payload.emailSender || 'hi@tapihq.com',
        emailSubject: payload.email?.subject || payload.emailSubject || null,
        emailMessageId: payload.email?.messageId || payload.emailMessageId || null,
        sourceUrl: payload.sourceUrl || payload.acceptance?.tapiUrl || null,

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

        // TAPI Acceptance
        tapiAccepted: payload.acceptance?.accepted || false,
        tapiAcceptedAt: payload.acceptance?.acceptedAt
          ? new Date(payload.acceptance.acceptedAt)
          : null,

        // Metadata
        rawData: payload,
      })
      .returning();

    // 5. Log activity
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

    // 6. Return success
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
