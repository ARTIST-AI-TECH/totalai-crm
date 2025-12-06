import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScheduleModalProps } from '@/lib/crm/types';
import { useState } from 'react';

/**
 * Schedule Job Modal Component
 *
 * Dialog for scheduling a work order with date/time picker.
 * Optionally allows selecting a technician if not already assigned.
 */
export function ScheduleModal({ open, order, technicians, onClose, onSchedule }: ScheduleModalProps) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [selectedTech, setSelectedTech] = useState(order?.assignedTo || '');

  if (!order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate) return;

    onSchedule(scheduledDate, order.assignedTo ? undefined : selectedTech);
    onClose();
    setScheduledDate('');
    setSelectedTech(order?.assignedTo || '');
  };

  const needsTechSelection = !order.assignedTo;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Work Order</DialogTitle>
          <DialogDescription>
            Set a date and time for {order.id} - {order.customer}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="scheduled-date">Scheduled Date & Time</Label>
            <Input
              id="scheduled-date"
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
            />
          </div>

          {needsTechSelection && (
            <div className="space-y-2">
              <Label htmlFor="technician">Assign Technician</Label>
              <Select value={selectedTech} onValueChange={setSelectedTech} required>
                <SelectTrigger id="technician">
                  <SelectValue placeholder="Select a technician" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.name}>
                      {tech.name} - {tech.status === 'available' ? '✓ Available' : '⏱ On Job'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Schedule</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
