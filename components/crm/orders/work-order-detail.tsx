import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PriorityBadge } from '@/components/crm/shared/priority-badge';
import { StatusBadge } from '@/components/crm/shared/status-badge';
import { WorkOrderDetailProps } from '@/lib/crm/types';
import {
  formatDateTime,
  formatCurrency,
  formatCurrencyDetailed,
  getTechnicianInitials,
  calculateInvoiceTotal
} from '@/lib/crm/utils';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  User,
  FileText,
  AlertTriangle,
  UserPlus,
  CalendarPlus,
  CheckCircle,
  Receipt,
  Send,
  CheckCheck
} from 'lucide-react';

/**
 * Work Order Detail Panel Component
 *
 * Sticky right-side panel showing full details of selected work order.
 * Displays conditional action buttons based on order status.
 */
export function WorkOrderDetail({
  order,
  onClose,
  onAssign,
  onSchedule,
  onComplete,
  onCreateInvoice,
  onSendInvoice,
  onMarkPaid
}: WorkOrderDetailProps) {
  if (!order) {
    return null;
  }

  // Determine which actions to show based on status
  const showAssign = !order.assignedTo;
  const showSchedule = order.assignedTo && !order.scheduledFor;
  const showComplete = order.status === 'in_progress';
  const showCreateInvoice = order.status === 'completed' && !order.invoice;
  const showSendInvoice = order.invoice?.status === 'draft';
  const showMarkPaid = order.invoice?.status === 'sent';

  const invoiceTotal = order.invoice ? calculateInvoiceTotal(order.invoice.items) : 0;

  return (
    <Card className="h-fit min-h-[600px]">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="font-mono text-lg">{order.id}</CardTitle>
              <PriorityBadge priority={order.priority} />
              <StatusBadge status={order.status} />
            </div>
            <h3 className="text-xl font-bold">{order.customer}</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {showAssign && (
            <Button onClick={onAssign} size="sm" variant="outline">
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Technician
            </Button>
          )}
          {showSchedule && (
            <Button onClick={onSchedule} size="sm" variant="outline">
              <CalendarPlus className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          )}
          {showComplete && (
            <Button onClick={onComplete} size="sm" className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Job
            </Button>
          )}
          {showCreateInvoice && (
            <Button onClick={onCreateInvoice} size="sm" variant="outline">
              <Receipt className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          )}
          {showSendInvoice && onSendInvoice && (
            <Button onClick={onSendInvoice} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Send className="h-4 w-4 mr-2" />
              Send Invoice
            </Button>
          )}
          {showMarkPaid && onMarkPaid && (
            <Button onClick={onMarkPaid} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark Paid
            </Button>
          )}
        </div>

        <Separator />

        {/* Issue Description */}
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Issue
          </h4>
          <p className="text-sm">{order.issue}</p>
        </div>

        {/* Contact Info */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm mb-2">Contact Information</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <a href={`tel:${order.phone}`} className="hover:text-foreground">
                {order.phone}
              </a>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${order.email}`} className="hover:text-foreground">
                {order.email}
              </a>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{order.address}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-1">
                  Notes
                </h4>
                <p className="text-sm text-amber-800 dark:text-amber-200">{order.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Value & Schedule Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span>Estimated Value</span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(order.estimatedValue)}</p>
            {order.actualValue && (
              <p className="text-sm text-muted-foreground">
                Actual: {formatCurrency(order.actualValue)}
              </p>
            )}
          </div>
          {order.scheduledFor && (
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span>Scheduled</span>
              </div>
              <p className="text-sm font-semibold">{formatDateTime(order.scheduledFor)}</p>
            </div>
          )}
        </div>

        {/* Assigned Technician */}
        {order.assignedTo && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <User className="h-4 w-4" />
                <span>Assigned Technician</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted">
                <Avatar>
                  <AvatarFallback className="bg-blue-600 text-white">
                    {getTechnicianInitials(order.assignedTo)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{order.assignedTo}</p>
                  <p className="text-xs text-muted-foreground">Assigned Technician</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Invoice Section */}
        {order.invoice && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Invoice {order.invoice.id}
                </h4>
                <Badge
                  variant={order.invoice.status === 'paid' ? 'default' : 'secondary'}
                  className={
                    order.invoice.status === 'paid'
                      ? 'bg-green-600'
                      : order.invoice.status === 'sent'
                      ? 'bg-blue-600'
                      : ''
                  }
                >
                  {order.invoice.status.charAt(0).toUpperCase() + order.invoice.status.slice(1)}
                </Badge>
              </div>
              <div className="space-y-2">
                {order.invoice.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.description} (x{item.qty})
                    </span>
                    <span className="font-semibold">
                      {formatCurrencyDetailed(item.qty * item.rate)}
                    </span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrencyDetailed(invoiceTotal)}</span>
                </div>
                {order.invoice.sentAt && (
                  <p className="text-xs text-muted-foreground">
                    Sent: {formatDateTime(order.invoice.sentAt)}
                  </p>
                )}
                {order.invoice.paidAt && (
                  <p className="text-xs text-green-600">
                    Paid: {formatDateTime(order.invoice.paidAt)}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
