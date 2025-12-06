import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AssignModalProps } from '@/lib/crm/types';
import { getTechnicianInitials } from '@/lib/crm/utils';
import { Badge } from '@/components/ui/badge';

/**
 * Assign Technician Modal Component
 *
 * Dialog for assigning a technician to a work order.
 * Shows technician availability and disables unavailable techs.
 */
export function AssignModal({ open, order, technicians, onClose, onAssign }: AssignModalProps) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Technician</DialogTitle>
          <DialogDescription>
            Select a technician to assign to {order.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-4">
          {technicians.map((tech) => {
            const isAvailable = tech.status === 'available';
            return (
              <Button
                key={tech.id}
                variant="outline"
                className="w-full justify-start h-auto py-3"
                disabled={!isAvailable}
                onClick={() => {
                  onAssign(tech.name);
                  onClose();
                }}
              >
                <Avatar className="mr-3" style={{ borderColor: tech.color, borderWidth: 2 }}>
                  <AvatarFallback
                    style={{ backgroundColor: `${tech.color}20`, color: tech.color }}
                  >
                    {getTechnicianInitials(tech.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="font-semibold">{tech.name}</p>
                  <p className="text-xs text-muted-foreground">{tech.phone}</p>
                </div>
                {isAvailable ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Available
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    On Job ({tech.currentJob})
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
