'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Technician } from '@/lib/crm/types';
import { getTechnicianInitials } from '@/lib/crm/utils';
import { cn } from '@/lib/utils';

interface TechStatusWidgetProps {
  technicians: Technician[];
  className?: string;
}

/**
 * Tech Status Widget Component
 *
 * Displays a list of technicians with their current status and assigned jobs.
 * Shows availability indicators and assigned work order IDs.
 */
export function TechStatusWidget({ technicians, className }: TechStatusWidgetProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Crew Status
        </h3>
        <span className="text-xs text-muted-foreground">
          {technicians.filter(t => t.status === 'available').length} Available
        </span>
      </div>

      <Separator />

      <div className="space-y-2">
        {technicians.map((tech) => (
          <div
            key={tech.id}
            className="flex items-center gap-3 px-2 py-1.5 hover:bg-muted/50 transition-colors"
          >
            <Avatar className="h-8 w-8" style={{ borderColor: tech.color, borderWidth: 2 }}>
              <AvatarFallback
                className="text-xs font-semibold"
                style={{ backgroundColor: `${tech.color}20`, color: tech.color }}
              >
                {getTechnicianInitials(tech.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{tech.name}</p>
              {tech.status === 'on_job' && tech.currentJob ? (
                <p className="text-xs text-muted-foreground font-mono">
                  {tech.currentJob}
                </p>
              ) : (
                <p className="text-xs text-green-500">Available</p>
              )}
            </div>

            <div
              className={cn(
                'w-2 h-2 rounded-full',
                tech.status === 'available' ? 'bg-green-500' : 'bg-blue-500'
              )}
              aria-label={tech.status === 'available' ? 'Available' : 'On Job'}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
