'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WebhookStatus } from '@/components/crm/webhooks/webhook-status';
import { initialWebhookLogs } from '@/lib/crm/mock-data';
import { formatDateTime } from '@/lib/crm/utils';
import { Activity, ArrowDownCircle, ArrowUpCircle, AlertCircle } from 'lucide-react';

/**
 * Webhooks Page
 *
 * Displays webhook activity log and connection status.
 * Shows all webhook events with timestamps and messages.
 */
export default function WebhooksPage() {
  const getIconForType = (type: string) => {
    switch (type) {
      case 'RECEIVED':
        return ArrowDownCircle;
      case 'SENT':
        return ArrowUpCircle;
      case 'ERROR':
        return AlertCircle;
      default:
        return Activity;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'RECEIVED':
        return 'text-blue-600 bg-blue-600/10';
      case 'SENT':
        return 'text-green-600 bg-green-600/10';
      case 'ERROR':
        return 'text-red-600 bg-red-600/10';
      default:
        return 'text-gray-600 bg-gray-600/10';
    }
  };

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Webhook Log</h1>
        <p className="text-muted-foreground mt-1">
          Monitor n8n webhook activity and work order synchronization
        </p>
      </div>

      {/* Webhook Status */}
      <WebhookStatus status="connected" lastPing={new Date()} />

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {initialWebhookLogs.map((log, index) => {
              const Icon = getIconForType(log.type);
              const colorClass = getColorForType(log.type);

              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border hover:bg-muted/50 transition-colors"
                >
                  <div className={`p-2 ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {log.type}
                      </Badge>
                      {log.orderId && (
                        <span className="font-mono text-xs text-muted-foreground">
                          {log.orderId}
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{log.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(log.timestamp.toISOString())}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {initialWebhookLogs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No webhook activity yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
