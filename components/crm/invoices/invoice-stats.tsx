import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Send, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/crm/utils';

interface InvoiceStatsProps {
  draftCount: number;
  sentCount: number;
  sentValue: number;
  paidCount: number;
  paidValue: number;
}

/**
 * Invoice Stats Component
 *
 * Displays 3 stat cards showing invoice metrics:
 * - Draft invoices count
 * - Sent invoices (count + value)
 * - Paid invoices (count + value)
 */
export function InvoiceStats({
  draftCount,
  sentCount,
  sentValue,
  paidCount,
  paidValue
}: InvoiceStatsProps) {
  const stats = [
    {
      title: 'Draft',
      count: draftCount,
      value: null,
      icon: FileText,
      color: 'text-gray-600',
      bgColor: 'bg-gray-600/10',
    },
    {
      title: 'Sent',
      count: sentCount,
      value: sentValue,
      icon: Send,
      color: 'text-blue-600',
      bgColor: 'bg-blue-600/10',
    },
    {
      title: 'Paid',
      count: paidCount,
      value: paidValue,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-600/10',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title} Invoices
              </CardTitle>
              <div className={`p-2 ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.count}</div>
              {stat.value !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(stat.value)} total
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
