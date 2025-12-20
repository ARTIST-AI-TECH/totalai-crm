import { NextRequest } from 'next/server';
import { getWorkOrders, getWorkOrderStats } from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  try {
    // TODO: Add authentication check
    const teamId = 1; // Platinum Plumbing team

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : undefined;

    const workOrders = await getWorkOrders(teamId, { status, priority, limit });
    const stats = await getWorkOrderStats(teamId);

    return Response.json({
      success: true,
      workOrders,
      stats,
      count: workOrders.length,
    });
  } catch (error) {
    console.error('Error fetching work orders:', error);
    return Response.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
