import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WorkOrder } from '@/lib/crm/types';
import { formatTime, formatCurrency } from '@/lib/crm/utils';
import { MapPin, Clock, User } from 'lucide-react';

interface RouteListProps {
  orders: WorkOrder[];
  onOrderClick?: (order: WorkOrder) => void;
}

/**
 * Route List Component
 *
 * Shows ordered list of jobs in route sequence.
 * Displays address, tech, time, and estimated value.
 */
export function RouteList({ orders, onOrderClick }: RouteListProps) {
  return (
    <Card className="h-[600px] overflow-auto">
      <CardHeader>
        <CardTitle>Route Order</CardTitle>
        <p className="text-sm text-muted-foreground">
          {orders.length} stops • Total: {formatCurrency(orders.reduce((sum, o) => sum + o.estimatedValue, 0))}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {orders.map((order, index) => (
          <div
            key={order.id}
            className="flex gap-3 p-3 border hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => onOrderClick?.(order)}
          >
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-sm truncate">{order.customer}</p>
                <Badge variant="outline" className="text-xs">{order.id}</Badge>
              </div>

              <div className="space-y-0.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="line-clamp-1">{order.address}</span>
                </div>
                {order.assignedTo && (
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3 flex-shrink-0" />
                    <span>{order.assignedTo}</span>
                  </div>
                )}
                {order.scheduledFor && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <span>{formatTime(order.scheduledFor)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="font-semibold text-sm">{formatCurrency(order.estimatedValue)}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
