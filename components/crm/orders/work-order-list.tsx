import { WorkOrderCard } from './work-order-card';
import { WorkOrderListProps } from '@/lib/crm/types';
import { getWorkOrdersByStatus } from '@/lib/crm/utils';

/**
 * Work Order List Component
 *
 * Renders a scrollable list of work order cards.
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
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>No work orders found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 overflow-auto max-h-[calc(100vh-400px)]">
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
