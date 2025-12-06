import { WorkOrderCardProps } from '@/lib/crm/types';
import { formatTime, formatCurrency } from '@/lib/crm/utils';
import { cn } from '@/lib/utils';

/**
 * Work Order Card Component (Outlook-style)
 *
 * Clean, minimal inbox-style row for work orders.
 * Simple design familiar to Microsoft users.
 */
export function WorkOrderCard({ order, isSelected, onClick }: WorkOrderCardProps) {
  const priorityIndicator = {
    urgent: 'bg-red-600',
    high: 'bg-orange-500',
    medium: 'bg-blue-500',
    low: 'bg-gray-400',
  };

  const statusText = {
    new: 'New',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <div
      className={cn(
        'relative border-b border-border p-4 cursor-pointer transition-colors hover:bg-muted/50',
        isSelected && 'bg-muted/70 border-l-4 border-l-primary'
      )}
      onClick={onClick}
    >
      {/* Priority indicator dot */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2">
        <div className={cn('w-2 h-2', priorityIndicator[order.priority])} />
      </div>

      <div className="pl-3">
        {/* Header row */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{order.customer}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
          </div>
          <span className="text-xs text-muted-foreground">{formatTime(order.receivedAt)}</span>
        </div>

        {/* Issue/Subject */}
        <p className="text-sm mb-2 line-clamp-1">{order.issue}</p>

        {/* Meta info row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>{statusText[order.status]}</span>
            {order.assignedTo && (
              <>
                <span>•</span>
                <span>{order.assignedTo}</span>
              </>
            )}
            <span>•</span>
            <span>{order.address.split(',')[0]}</span>
          </div>
          <span className="font-semibold text-foreground">{formatCurrency(order.estimatedValue)}</span>
        </div>
      </div>
    </div>
  );
}
