import { Badge } from '@/components/ui/badge';
import { getStatusStyles } from '@/lib/crm/utils';
import { StatusBadgeProps } from '@/lib/crm/types';
import { cn } from '@/lib/utils';

/**
 * Status Badge Component
 *
 * Displays a color-coded status badge for work orders.
 * Colors: new (copper), in_progress (blue), completed (green), cancelled (gray)
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = getStatusStyles(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        styles.bg,
        styles.text,
        'font-medium text-xs border-none px-2 py-1',
        className
      )}
    >
      {styles.label}
    </Badge>
  );
}
