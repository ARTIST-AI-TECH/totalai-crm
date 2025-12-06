import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WebhookStatusProps } from '@/lib/crm/types';
import { formatRelativeTime } from '@/lib/crm/utils';
import { Link2, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Webhook Status Component
 *
 * Shows webhook connection status with pulsing indicator.
 * Displays last ping time and connection state.
 */
export function WebhookStatus({ status, lastPing }: WebhookStatusProps) {
  const statusConfig = {
    connected: {
      icon: CheckCircle2,
      label: 'Connected',
      color: 'text-green-600',
      bgColor: 'bg-green-600/10',
      badgeClass: 'bg-green-600',
    },
    disconnected: {
      icon: AlertCircle,
      label: 'Disconnected',
      color: 'text-gray-600',
      bgColor: 'bg-gray-600/10',
      badgeClass: 'bg-gray-600',
    },
    error: {
      icon: AlertCircle,
      label: 'Error',
      color: 'text-red-600',
      bgColor: 'bg-red-600/10',
      badgeClass: 'bg-red-600',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Webhook Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 ${config.bgColor}`}>
            <Icon className={`h-6 w-6 ${config.color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge className={config.badgeClass}>
                {config.label}
              </Badge>
              {status === 'connected' && (
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last ping: {formatRelativeTime(lastPing.toISOString())}
            </p>
          </div>
        </div>

        <div className="bg-muted/50 p-3">
          <p className="text-xs font-mono text-muted-foreground break-all">
            https://your-n8n-instance.com/webhook/work-orders
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
