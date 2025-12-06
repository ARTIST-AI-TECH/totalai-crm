// =============================================================================
// ENUMS & TYPES
// =============================================================================

export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type Status = 'new' | 'in_progress' | 'completed' | 'cancelled';
export type InvoiceStatus = 'draft' | 'sent' | 'paid';
export type TechStatus = 'available' | 'on_job' | 'off_duty';
export type WebhookLogType = 'RECEIVED' | 'SENT' | 'ERROR';

// =============================================================================
// INTERFACES
// =============================================================================

export interface InvoiceItem {
  description: string;
  qty: number;
  rate: number;
}

export interface Invoice {
  id: string;
  items: InvoiceItem[];
  status: InvoiceStatus;
  sentAt?: string;
  paidAt?: string;
}

export interface WorkOrder {
  id: string;
  customer: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  issue: string;
  priority: Priority;
  status: Status;
  source: string;
  receivedAt: string;
  scheduledFor: string | null;
  completedAt?: string;
  assignedTo?: string;
  estimatedValue: number;
  actualValue?: number;
  notes?: string;
  invoice?: Invoice;
  isRead?: boolean; // Outlook-style read/unread state
}

export interface Technician {
  id: number;
  name: string;
  phone: string;
  status: TechStatus;
  currentJob: string | null;
  color: string;
}

export interface WebhookLog {
  timestamp: Date;
  type: WebhookLogType;
  orderId: string | null;
  message: string;
}

// =============================================================================
// COMPONENT PROPS INTERFACES
// =============================================================================

export interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export interface WorkOrderCardProps {
  order: WorkOrder;
  isSelected: boolean;
  onClick: () => void;
}

export interface WorkOrderListProps {
  orders: WorkOrder[];
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string) => void;
  activeFilter: string;
}

export interface WorkOrderDetailProps {
  order: WorkOrder | null;
  onClose: () => void;
  onAssign: () => void;
  onSchedule: () => void;
  onComplete: () => void;
  onCreateInvoice: () => void;
  onSendInvoice?: () => void;
  onMarkPaid?: () => void;
}

export interface AssignModalProps {
  open: boolean;
  order: WorkOrder | null;
  technicians: Technician[];
  onClose: () => void;
  onAssign: (techName: string) => void;
}

export interface ScheduleModalProps {
  open: boolean;
  order: WorkOrder | null;
  technicians: Technician[];
  onClose: () => void;
  onSchedule: (date: string, techName?: string) => void;
}

export interface TechScheduleCardProps {
  technician: Technician;
  assignedJobs: WorkOrder[];
}

export interface OrderStatsProps {
  newCount: number;
  inProgressCount: number;
  completedCount: number;
  todayRevenue: number;
  pipelineValue: number;
}

export interface InvoiceCardProps {
  workOrder: WorkOrder;
  onSend?: () => void;
  onMarkPaid?: () => void;
}

export interface MapMarkerProps {
  order: WorkOrder;
  index: number;
  onClick?: () => void;
}

export interface WebhookStatusProps {
  status: 'connected' | 'disconnected' | 'error';
  lastPing: Date;
}

export interface NotificationProps {
  type: 'success' | 'error' | 'info';
  message: string;
  onDismiss: () => void;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface DashboardStats {
  newCount: number;
  inProgressCount: number;
  completedCount: number;
  todayRevenue: number;
  pipelineValue: number;
  unpaidInvoices: number;
}

export interface PriorityConfig {
  bg: string;
  border: string;
  text: string;
  label: string;
}

export interface StatusConfig {
  bg: string;
  text: string;
  label: string;
}
