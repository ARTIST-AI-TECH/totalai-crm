import { NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { workOrders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    // Twilio sends data as form-urlencoded
    const formData = await req.formData();

    const messageSid = formData.get('MessageSid') as string;
    const messageStatus = formData.get('MessageStatus') as string;

    console.log('📱 Twilio status update:', {
      messageSid,
      messageStatus,
      to: formData.get('To'),
    });

    if (!messageSid || !messageStatus) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update work order SMS status
    const result = await db
      .update(workOrders)
      .set({
        smsStatus: messageStatus,
      })
      .where(eq(workOrders.smsSid, messageSid))
      .returning({ id: workOrders.id, externalId: workOrders.externalId });

    if (result.length === 0) {
      console.log('⚠️ No work order found for SMS SID:', messageSid);
      return Response.json({ success: true, message: 'SMS SID not found' }, { status: 200 });
    }

    console.log('✅ SMS status updated:', {
      workOrderId: result[0].externalId,
      status: messageStatus
    });

    return Response.json({
      success: true,
      workOrderId: result[0].id,
      externalId: result[0].externalId
    });

  } catch (error) {
    console.error('❌ Twilio webhook error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
