import { Card } from '@/components/ui/card';
import { PriorityBadge } from '@/components/crm/shared/priority-badge';
import { StatusBadge } from '@/components/crm/shared/status-badge';
import { WorkOrderCardProps } from '@/lib/crm/types';
import { formatTime, formatCurrency, getPriorityStripeColor } from '@/lib/crm/utils';
import { MapPin, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Work Order Card Component
 *
 * Displays an individual work order with priority stripe, badges, and key details.
 * Highlights when selected. Shows customer, issue, location, time, tech, and value.
 */
export function WorkOrderCard({ order, isSelected, onClick }: WorkOrderCardProps) {
  const stripeColor = getPriorityStripeColor(order.priority);

  return (
    <Card
      className={cn(
        'relative overflow-hidden cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]',
        isSelected && 'ring-2 ring-orange-600 bg-orange-600/5'
      )}
      onClick={onClick}
    >
      {/* Priority stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: stripeColor }}
      />

      <div className="p-4 pl-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {order.id}
            </span>
            <PriorityBadge priority={order.priority} />
            <StatusBadge status={order.status} />
          </div>
          <span className="text-xs text-muted-foreground">
            {formatTime(order.receivedAt)}
          </span>
        </div>

        {/* Customer & Issue */}
        <h3 className="font-semibold text-sm mb-1">{order.customer}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {order.issue}
        </p>

        {/* Footer details */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[120px]">
                {order.address.split(',')[0]}
              </span>
            </div>
            {order.scheduledFor && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatTime(order.scheduledFor)}</span>
              </div>
            )}
            {order.assignedTo && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{order.assignedTo.split(' ')[0]}</span>
              </div>
            )}
          </div>
          <div className="font-semibold text-foreground">
            {formatCurrency(order.estimatedValue)}
          </div>
        </div>
      </div>
    </Card>
  );
}
