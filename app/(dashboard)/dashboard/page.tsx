import { WorkOrdersClient } from '@/components/crm/orders/work-orders-client';
import { getWorkOrders, getWorkOrderStats, getTechnicians, getTeamForUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

export default async function WorkOrdersPage() {
  // Get team from authenticated user
  const team = await getTeamForUser();

  if (!team) {
    redirect('/sign-in');
  }

  // Fetch real data from database
  const workOrders = await getWorkOrders(team.id);
  const stats = await getWorkOrderStats(team.id);
  const technicians = await getTechnicians(team.id);

  return (
    <WorkOrdersClient
      initialWorkOrders={workOrders}
      initialStats={stats}
      technicians={technicians}
    />
  );
}
