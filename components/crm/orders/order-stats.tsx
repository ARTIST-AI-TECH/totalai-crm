import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Clock, CheckCircle2, DollarSign, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/crm/utils';

interface OrderStatsProps {
  newCount: number;
  inProgressCount: number;
  completedCount: number;
  todayRevenue: number;
  pipelineValue: number;
}

/**
 * Order Stats Component (Outlook-style)
 *
 * Clean, minimal stat cards with subtle colors.
 * Professional look familiar to Microsoft users.
 */
export function OrderStats({
  newCount,
  inProgressCount,
  completedCount,
  todayRevenue,
  pipelineValue
}: OrderStatsProps) {
  const stats = [
    {
      title: 'New',
      value: newCount,
      icon: ClipboardList,
    },
    {
      title: 'In Progress',
      value: inProgressCount,
      icon: Clock,
    },
    {
      title: 'Completed',
      value: completedCount,
      icon: CheckCircle2,
    },
    {
      title: 'Revenue',
      value: formatCurrency(todayRevenue),
      icon: DollarSign,
    },
    {
      title: 'Pipeline',
      value: formatCurrency(pipelineValue),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
