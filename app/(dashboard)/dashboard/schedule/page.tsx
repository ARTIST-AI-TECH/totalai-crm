'use client';

import { TechScheduleCard } from '@/components/crm/schedule/tech-schedule-card';
import { technicians, initialWorkOrders } from '@/lib/crm/mock-data';

/**
 * Schedule Page
 *
 * Displays technician schedules in a grid layout.
 * Shows each tech's assigned jobs for the day.
 */
export default function SchedulePage() {
  // Get today's scheduled jobs per technician
  const getJobsForTech = (techName: string) => {
    return initialWorkOrders.filter(
      (order) => order.assignedTo === techName && order.scheduledFor
    );
  };

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Schedule</h1>
        <p className="text-muted-foreground mt-1">
          Technician schedules and assigned jobs for today
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {technicians.map((tech) => (
          <TechScheduleCard
            key={tech.id}
            technician={tech}
            assignedJobs={getJobsForTech(tech.name)}
          />
        ))}
      </div>
    </div>
  );
}
