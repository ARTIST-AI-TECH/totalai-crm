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
 * Order Stats Component
 *
 * Displays 5 stat cards showing key metrics for work orders:
 * - New orders count
 * - In progress count
 * - Completed today count
 * - Today's revenue
 * - Pipeline value (estimated)
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
      color: 'text-orange-600',
      bgColor: 'bg-orange-600/10',
    },
    {
      title: 'In Progress',
      value: inProgressCount,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-600/10',
    },
    {
      title: 'Completed',
      value: completedCount,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-600/10',
    },
    {
      title: 'Revenue',
      value: formatCurrency(todayRevenue),
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-600/10',
    },
    {
      title: 'Pipeline',
      value: formatCurrency(pipelineValue),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-600/10',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="border-t-4 border-t-orange-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
