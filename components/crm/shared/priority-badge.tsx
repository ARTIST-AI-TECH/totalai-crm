import { Badge } from '@/components/ui/badge';
import { getPriorityStyles } from '@/lib/crm/utils';
import { PriorityBadgeProps } from '@/lib/crm/types';
import { cn } from '@/lib/utils';

/**
 * Priority Badge Component
 *
 * Displays a color-coded priority badge for work orders.
 * Colors: urgent (red), high (amber), medium (blue), low (green)
 */
export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const styles = getPriorityStyles(priority);

  return (
    <Badge
      variant="outline"
      className={cn(
        styles.bg,
        styles.border,
        styles.text,
        'font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5',
        className
      )}
    >
      {styles.label}
    </Badge>
  );
}
