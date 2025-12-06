import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TechScheduleCardProps } from '@/lib/crm/types';
import { getTechnicianInitials, formatTime, formatCurrency } from '@/lib/crm/utils';
import { Clock, MapPin, DollarSign } from 'lucide-react';

/**
 * Tech Schedule Card Component
 *
 * Displays a technician's schedule with assigned jobs for the day.
 * Shows tech info, status, and list of scheduled work orders.
 */
export function TechScheduleCard({ technician, assignedJobs }: TechScheduleCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12" style={{ borderColor: technician.color, borderWidth: 2 }}>
            <AvatarFallback
              className="text-sm font-bold"
              style={{ backgroundColor: `${technician.color}20`, color: technician.color }}
            >
              {getTechnicianInitials(technician.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-base">{technician.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{technician.phone}</p>
          </div>
          <Badge
            variant={technician.status === 'available' ? 'outline' : 'secondary'}
            className={
              technician.status === 'available'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }
          >
            {technician.status === 'available' ? 'Available' : 'On Job'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {assignedJobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No jobs scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignedJobs.map((job) => (
              <div
                key={job.id}
                className="p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm mb-1">{job.customer}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{job.issue}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="ml-2 text-xs"
                    style={{
                      backgroundColor: `${technician.color}15`,
                      color: technician.color,
                      borderColor: `${technician.color}40`
                    }}
                  >
                    {job.id}
                  </Badge>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  {job.scheduledFor && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(job.scheduledFor)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    <span className="line-clamp-1">{job.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3 w-3" />
                    <span>{formatCurrency(job.estimatedValue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {assignedJobs.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{assignedJobs.length} jobs scheduled</span>
              <span className="font-semibold">
                {formatCurrency(assignedJobs.reduce((sum, job) => sum + job.estimatedValue, 0))}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
