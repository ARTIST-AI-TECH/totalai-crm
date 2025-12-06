import { WorkOrderCardProps } from '@/lib/crm/types';
import { formatTime, formatCurrency } from '@/lib/crm/utils';
import { cn } from '@/lib/utils';

/**
 * Work Order Card Component (Outlook-style)
 *
 * Minimal inbox row - unread items have blue accent, read items are gray.
 * Single accent color like Outlook/Gmail.
 */
export function WorkOrderCard({ order, isSelected, onClick }: WorkOrderCardProps) {
  const isUnread = !order.isRead;

  const statusText = {
    new: 'New',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <div
      className={cn(
        'relative border-b border-border p-4 cursor-pointer transition-colors',
        isUnread && !isSelected && 'bg-primary/5',
        !isUnread && 'hover:bg-muted/30',
        isSelected && 'bg-primary/10 border-l-4 border-l-primary'
      )}
      onClick={onClick}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2">
          <div className="w-2 h-2 bg-primary" />
        </div>
      )}

      <div className={cn('pl-3', isUnread && 'pl-5')}>
        {/* Header row */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className={cn('text-sm', isUnread ? 'font-bold' : 'font-medium')}>
              {order.customer}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
          </div>
          <span className="text-xs text-muted-foreground">{formatTime(order.receivedAt)}</span>
        </div>

        {/* Issue/Subject */}
        <p className={cn('text-sm mb-2 line-clamp-1', isUnread && 'font-semibold')}>
          {order.issue}
        </p>

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
          <span className={cn('text-foreground', isUnread && 'font-semibold')}>
            {formatCurrency(order.estimatedValue)}
          </span>
        </div>
      </div>
    </div>
  );
}
