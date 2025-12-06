import { Priority, Status, PriorityConfig, StatusConfig } from './types';

// =============================================================================
// PRIORITY CONFIGURATION
// =============================================================================
export const priorityConfig: Record<Priority, PriorityConfig> = {
  urgent: {
    bg: 'bg-red-900/50 dark:bg-red-900/30',
    border: 'border-red-500',
    text: 'text-red-300',
    label: 'URGENT'
  },
  high: {
    bg: 'bg-amber-900/50 dark:bg-amber-900/30',
    border: 'border-amber-500',
    text: 'text-amber-300',
    label: 'HIGH'
  },
  medium: {
    bg: 'bg-blue-900/50 dark:bg-blue-900/30',
    border: 'border-blue-500',
    text: 'text-blue-300',
    label: 'MEDIUM'
  },
  low: {
    bg: 'bg-green-900/50 dark:bg-green-900/30',
    border: 'border-green-500',
    text: 'text-green-300',
    label: 'LOW'
  }
};

export function getPriorityStyles(priority: Priority): PriorityConfig {
  return priorityConfig[priority];
}

// =============================================================================
// STATUS CONFIGURATION
// =============================================================================
export const statusConfig: Record<Status, StatusConfig> = {
  new: {
    bg: 'bg-orange-900/50 dark:bg-orange-900/30',
    text: 'text-orange-300',
    label: 'New'
  },
  in_progress: {
    bg: 'bg-blue-900/50 dark:bg-blue-900/30',
    text: 'text-blue-300',
    label: 'In Progress'
  },
  completed: {
    bg: 'bg-green-900/50 dark:bg-green-900/30',
    text: 'text-green-300',
    label: 'Completed'
  },
  cancelled: {
    bg: 'bg-gray-900/50 dark:bg-gray-900/30',
    text: 'text-gray-400',
    label: 'Cancelled'
  }
};

export function getStatusStyles(status: Status): StatusConfig {
  return statusConfig[status];
}

// =============================================================================
// PRIORITY STRIPE COLOR (for work order cards)
// =============================================================================
export function getPriorityStripeColor(priority: Priority): string {
  const colors = {
    urgent: '#dc2626',   // red-600
    high: '#f59e0b',     // amber-500
    medium: '#3b82f6',   // blue-500
    low: '#22c55e'       // green-500
  };
  return colors[priority];
}

// =============================================================================
// DATE/TIME FORMATTING
// =============================================================================
export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

// =============================================================================
// CURRENCY FORMATTING
// =============================================================================
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatCurrencyDetailed(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// =============================================================================
// INVOICE CALCULATIONS
// =============================================================================
export function calculateInvoiceTotal(items: { qty: number; rate: number }[]): number {
  return items.reduce((total, item) => total + (item.qty * item.rate), 0);
}

// =============================================================================
// TECHNICIAN HELPERS
// =============================================================================
export function getTechnicianInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
}

export function getTechnicianColor(color: string): { bg: string; text: string } {
  // Convert hex color to Tailwind-like utility classes
  const colorMap: Record<string, { bg: string; text: string }> = {
    '#3b82f6': { bg: 'bg-blue-500', text: 'text-blue-500' },
    '#22c55e': { bg: 'bg-green-500', text: 'text-green-500' },
    '#a855f7': { bg: 'bg-purple-500', text: 'text-purple-500' },
  };

  return colorMap[color] || { bg: 'bg-blue-500', text: 'text-blue-500' };
}

// =============================================================================
// WORK ORDER HELPERS
// =============================================================================
export function getWorkOrdersByStatus(orders: any[], status: string): any[] {
  if (status === 'all') return orders;
  return orders.filter(order => order.status === status);
}

export function getNewOrdersCount(orders: any[]): number {
  return orders.filter(order => order.status === 'new').length;
}

export function getInProgressCount(orders: any[]): number {
  return orders.filter(order => order.status === 'in_progress').length;
}

export function getCompletedTodayCount(orders: any[]): number {
  const today = new Date().toDateString();
  return orders.filter(order => {
    if (!order.completedAt) return false;
    const completedDate = new Date(order.completedAt).toDateString();
    return completedDate === today;
  }).length;
}

export function getTodayRevenue(orders: any[]): number {
  const today = new Date().toDateString();
  return orders
    .filter(order => {
      if (!order.completedAt) return false;
      const completedDate = new Date(order.completedAt).toDateString();
      return completedDate === today;
    })
    .reduce((sum, order) => sum + (order.actualValue || 0), 0);
}

export function getPipelineValue(orders: any[]): number {
  return orders
    .filter(order => order.status !== 'completed' && order.status !== 'cancelled')
    .reduce((sum, order) => sum + (order.estimatedValue || 0), 0);
}

export function getUnpaidInvoicesCount(orders: any[]): number {
  return orders.filter(order => {
    return order.invoice && order.invoice.status !== 'paid';
  }).length;
}

// =============================================================================
// MAP HELPERS
// =============================================================================
export function calculateMapPosition(lat: number, lng: number): { x: number; y: number } {
  // Simple conversion for Austin, TX area
  // Latitude range: ~30.1 to 30.6
  // Longitude range: ~-98.0 to -97.5

  const LAT_MIN = 30.1;
  const LAT_MAX = 30.6;
  const LNG_MIN = -98.0;
  const LNG_MAX = -97.5;

  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 100;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100; // Inverted for CSS

  return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
}
