import { WorkOrderCard } from './work-order-card';
import { WorkOrderListProps } from '@/lib/crm/types';
import { getWorkOrdersByStatus } from '@/lib/crm/utils';

/**
 * Work Order List Component (Outlook-style)
 *
 * Renders a clean inbox-style list of work order rows.
 * Filters orders based on active status filter.
 */
export function WorkOrderList({
  orders,
  selectedOrderId,
  onSelectOrder,
  activeFilter
}: WorkOrderListProps) {
  const filteredOrders = getWorkOrdersByStatus(orders, activeFilter);

  if (filteredOrders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground bg-background border">
        <p>No work orders found</p>
      </div>
    );
  }

  return (
    <div className="bg-background border overflow-auto h-[calc(100vh-350px)]">
      {filteredOrders.map((order) => (
        <WorkOrderCard
          key={order.id}
          order={order}
          isSelected={selectedOrderId === order.id}
          onClick={() => onSelectOrder(order.id)}
        />
      ))}
    </div>
  );
}
