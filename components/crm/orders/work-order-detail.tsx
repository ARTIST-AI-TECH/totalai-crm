import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  CheckCheck,
  ExternalLink,
  Briefcase,
  MessageSquare
} from 'lucide-react';

/**
 * Work Order Detail Panel Component (Outlook-style)
 *
 * Clean, professional detail view matching Outlook's reading pane.
 * Displays full order information with minimal colors.
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

  const priorityLabels = {
    urgent: 'URGENT',
    high: 'High Priority',
    medium: 'Medium Priority',
    low: 'Low Priority',
  };

  return (
    <Card className="h-fit min-h-[600px]">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">{order.customer}</h3>
              <span className="text-sm text-muted-foreground">{priorityLabels[order.priority]}</span>
            </div>
            <p className="text-sm text-muted-foreground font-mono">{order.id}</p>
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
            <Button onClick={onComplete} size="sm">
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
            <Button onClick={onSendInvoice} size="sm">
              <Send className="h-4 w-4 mr-2" />
              Send Invoice
            </Button>
          )}
          {showMarkPaid && onMarkPaid && (
            <Button onClick={onMarkPaid} size="sm">
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark Paid
            </Button>
          )}
        </div>

        <Separator />

        {/* Issue Description */}
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            Issue Description
          </h4>
          <p className="text-sm leading-relaxed">{order.issue}</p>
        </div>

        {/* Contact Info */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm mb-3 text-muted-foreground">Contact Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${order.phone}`} className="hover:underline">
                {order.phone}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${order.email}`} className="hover:underline">
                {order.email}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{order.address}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-l-amber-500 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Notes</h4>
                <p className="text-sm">{order.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Simpro Job Link */}
        {(order as any).simproJobUrl && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-sm">Simpro Job Created</h4>
                  <p className="text-xs text-muted-foreground">
                    Job #{(order as any).simproJobId} • {(order as any).jobCreatedAt ? new Date((order as any).jobCreatedAt).toLocaleString() : 'Today'}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={(order as any).simproJobUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                  View in Simpro
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Automation & Schedule Grid */}
        <div className="grid grid-cols-2 gap-6">
          {(order as any).simproJobId && (
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Briefcase className="h-4 w-4" />
                <span>Added to Simpro</span>
              </div>
              <p className="text-lg font-semibold">Job #{(order as any).simproJobId}</p>
              {(order as any).jobCreatedAt && (
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date((order as any).jobCreatedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {(order as any).smsSent && (
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <MessageSquare className="h-4 w-4" />
                <span>SMS Notification</span>
              </div>
              <p className="text-lg font-semibold">
                {(order as any).smsStatus === 'delivered' ? '✓ Delivered' :
                 (order as any).smsStatus === 'sent' ? '✓ Sent' :
                 (order as any).smsStatus === 'queued' ? 'Queued' : '✓ Sent'}
              </p>
              {(order as any).smsSentAt && (
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date((order as any).smsSentAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
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
              <div className="flex items-center gap-3 p-3 bg-muted/50 border">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
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
                <h4 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">
                  <Receipt className="h-4 w-4" />
                  Invoice {order.invoice.id}
                </h4>
                <span className="text-sm font-medium">
                  {order.invoice.status === 'paid' && '✓ Paid'}
                  {order.invoice.status === 'sent' && 'Sent'}
                  {order.invoice.status === 'draft' && 'Draft'}
                </span>
              </div>
              <div className="space-y-2 bg-muted/30 p-4 border">
                {order.invoice.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>
                      {item.description} (x{item.qty})
                    </span>
                    <span className="font-semibold">
                      {formatCurrencyDetailed(item.qty * item.rate)}
                    </span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrencyDetailed(invoiceTotal)}</span>
                </div>
                {order.invoice.sentAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Sent: {formatDateTime(order.invoice.sentAt)}
                  </p>
                )}
                {order.invoice.paidAt && (
                  <p className="text-xs text-muted-foreground mt-1">
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
