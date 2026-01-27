'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { OrderFilters } from '@/components/crm/orders/order-filters';
import { WorkOrderList } from '@/components/crm/orders/work-order-list';
import { WorkOrderDetail } from '@/components/crm/orders/work-order-detail';
import { AssignModal } from '@/components/crm/orders/assign-modal';
import { ScheduleModal } from '@/components/crm/orders/schedule-modal';
import { NotificationToast } from '@/components/crm/shared/notification-toast';
import { ProcessWorkOrdersButton } from '@/components/crm/orders/process-work-orders-button';
import { WorkOrder as DBWorkOrder, Technician } from '@/lib/db/schema';
import { WorkOrder } from '@/lib/crm/types';

// Convert database work order to UI work order type
function convertToUIWorkOrder(dbOrder: any): WorkOrder {
  // Helper to convert timestamp to ISO string (handles both Date objects and strings)
  const toISOString = (value: any) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    return value.toISOString();
  };

  return {
    id: dbOrder.externalId || dbOrder.external_id, // Handle both camelCase and snake_case
    customer: dbOrder.tenantName || dbOrder.tenant_name || 'Unknown',
    address: dbOrder.propertyAddress || dbOrder.property_address || '',
    lat: 0, // TODO: Geocode address
    lng: 0, // TODO: Geocode address
    phone: dbOrder.tenantPhone || dbOrder.tenant_phone || '',
    email: dbOrder.tenantEmail || dbOrder.tenant_email || '',
    issue: dbOrder.issueTitle || dbOrder.issue_title || '',
    priority: dbOrder.priority as any,
    status: dbOrder.status as any,
    source: dbOrder.pmPlatform || dbOrder.pm_platform || 'Email',
    receivedAt: toISOString(dbOrder.receivedAt || dbOrder.received_at) || new Date().toISOString(),
    scheduledFor: toISOString(dbOrder.scheduledFor || dbOrder.scheduled_for),
    completedAt: toISOString(dbOrder.completedAt || dbOrder.completed_at),
    assignedTo: dbOrder.assignedTechnician?.name,
    estimatedValue: dbOrder.estimatedValue || dbOrder.estimated_value ? Number(dbOrder.estimatedValue || dbOrder.estimated_value) : 0,
    actualValue: dbOrder.actualValue || dbOrder.actual_value ? Number(dbOrder.actualValue || dbOrder.actual_value) : 0,
    notes: dbOrder.issueDescription || dbOrder.issue_description,
    isRead: dbOrder.isRead || dbOrder.is_read || false,
    // Add Simpro metadata for display (handle both formats)
    simproJobUrl: dbOrder.simproJobUrl || dbOrder.simpro_job_url,
    simproJobId: dbOrder.simproJobId || dbOrder.simpro_job_id,
    jobCreatedAt: dbOrder.jobCreatedAt || dbOrder.job_created_at,
    // Add SMS metadata
    smsSent: dbOrder.smsSent || dbOrder.sms_sent,
    smsStatus: dbOrder.smsStatus || dbOrder.sms_status,
    smsSentAt: dbOrder.smsSentAt || dbOrder.sms_sent_at,
  };
}

interface Props {
  initialWorkOrders: any[]; // DB WorkOrders with relations
  initialStats: {
    total: number;
    new: number;
    jobCreated: number;
    assigned: number;
    completed: number;
    completedToday: number;
    totalRevenue: number;
    pipelineValue: number;
  };
  technicians: Technician[];
}

export function WorkOrdersClient({ initialWorkOrders, initialStats, technicians }: Props) {
  // Convert DB work orders to UI format
  const uiOrders = initialWorkOrders.map(convertToUIWorkOrder);

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(uiOrders);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    uiOrders.length > 0 ? uiOrders[0].id : null
  );
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Track subscription channel for cleanup
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Get team ID from initial data
  const teamId = initialWorkOrders[0]?.teamId || 1;

  // Set up Realtime subscription
  useEffect(() => {
    console.log('🔵 Setting up Realtime subscription for team:', teamId);

    const channel = supabase
      .channel('work-orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'work_orders',
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          console.log('🟢 New work order via Realtime:', payload.new);

          try {
            // Convert DB format to UI format
            const newWorkOrder = convertToUIWorkOrder(payload.new);

            // Add to top of list
            setWorkOrders((prev) => [newWorkOrder, ...prev]);

            // Show notification
            setNotification({
              type: 'info',
              message: `New work order: ${newWorkOrder.id}`,
            });

            // Auto-select if none selected
            if (!selectedOrderId) {
              setSelectedOrderId(newWorkOrder.id);
            }
          } catch (error) {
            console.error('❌ Error processing Realtime event:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime status:', status);
      });

    channelRef.current = channel;

    return () => {
      console.log('🔴 Cleaning up Realtime subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [teamId]);

  const selectedOrder = workOrders.find((order) => order.id === selectedOrderId) || null;

  // Use stats from server
  const newCount = initialStats.new;
  const inProgressCount = initialStats.assigned;
  const completedCount = initialStats.completedToday;
  const todayRevenue = initialStats.totalRevenue;
  const pipelineValue = initialStats.pipelineValue;

  // Calculate filter counts
  const filterCounts = {
    all: workOrders.length,
    new: newCount,
    in_progress: inProgressCount,
    completed: workOrders.filter((o) => o.status === 'completed').length,
  };

  // Mark as read when selected
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setWorkOrders((orders) =>
      orders.map((order) =>
        order.id === orderId ? { ...order, isRead: true } : order
      )
    );
  };

  // Action handlers
  const handleAssignTechnician = (techName: string) => {
    if (!selectedOrder) return;

    setWorkOrders((orders) =>
      orders.map((order) =>
        order.id === selectedOrder.id
          ? { ...order, assignedTo: techName, status: 'in_progress' as const }
          : order
      )
    );

    setNotification({
      type: 'success',
      message: `${techName} assigned to ${selectedOrder.id}`,
    });
  };

  const handleScheduleJob = (date: string, techName?: string) => {
    if (!selectedOrder) return;

    setWorkOrders((orders) =>
      orders.map((order) =>
        order.id === selectedOrder.id
          ? {
              ...order,
              scheduledFor: date,
              ...(techName && { assignedTo: techName, status: 'in_progress' as const }),
            }
          : order
      )
    );

    setNotification({
      type: 'success',
      message: `${selectedOrder.id} scheduled for ${new Date(date).toLocaleString()}`,
    });
  };

  const handleCompleteOrder = () => {
    if (!selectedOrder) return;

    setWorkOrders((orders) =>
      orders.map((order) =>
        order.id === selectedOrder.id
          ? {
              ...order,
              status: 'completed' as const,
              completedAt: new Date().toISOString(),
            }
          : order
      )
    );

    setNotification({
      type: 'success',
      message: `${selectedOrder.id} marked as completed`,
    });
  };

  const handleCreateInvoice = () => {
    if (!selectedOrder) return;

    const invoice = {
      id: `INV-${selectedOrder.id.split('-')[2]}`,
      items: [
        {
          description: selectedOrder.issue.substring(0, 50),
          qty: 1,
          rate: selectedOrder.actualValue || selectedOrder.estimatedValue,
        },
      ],
      status: 'draft' as const,
    };

    setWorkOrders((orders) =>
      orders.map((order) =>
        order.id === selectedOrder.id
          ? { ...order, invoice, actualValue: selectedOrder.estimatedValue }
          : order
      )
    );

    setNotification({
      type: 'success',
      message: `Invoice ${invoice.id} created`,
    });
  };

  const handleSendInvoice = () => {
    if (!selectedOrder || !selectedOrder.invoice) return;

    setWorkOrders((orders) =>
      orders.map((order) =>
        order.id === selectedOrder.id && order.invoice
          ? {
              ...order,
              invoice: {
                ...order.invoice,
                status: 'sent' as const,
                sentAt: new Date().toISOString(),
              },
            }
          : order
      )
    );

    setNotification({
      type: 'success',
      message: `Invoice sent to ${selectedOrder.customer}`,
    });
  };

  const handleMarkPaid = () => {
    if (!selectedOrder || !selectedOrder.invoice) return;

    setWorkOrders((orders) =>
      orders.map((order) =>
        order.id === selectedOrder.id && order.invoice
          ? {
              ...order,
              invoice: {
                ...order.invoice,
                status: 'paid' as const,
                paidAt: new Date().toISOString(),
              },
            }
          : order
      )
    );

    setNotification({
      type: 'success',
      message: `Payment received for ${selectedOrder.invoice.id}`,
    });
  };

  // Convert technicians to UI format (mock type)
  const uiTechnicians = technicians.map((tech) => ({
    id: tech.id,
    name: tech.name,
    phone: tech.phone || '',
    status: (tech.status as any) || 'available',
    currentJob: tech.currentJobId ? `Job #${tech.currentJobId}` : null,
    color: tech.color || '#3b82f6',
  }));

  return (
    <div className="space-y-6 py-6">
      {/* Manual Process Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Work Orders</h1>
        <ProcessWorkOrdersButton />
      </div>

      {/* Filters */}
      <OrderFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={filterCounts}
      />

      {/* Inbox-style layout: List (1/3) + Detail (2/3) */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <WorkOrderList
            orders={workOrders}
            selectedOrderId={selectedOrderId}
            onSelectOrder={handleSelectOrder}
            activeFilter={activeFilter}
          />
        </div>

        <div className="lg:col-span-2">
          <WorkOrderDetail
            order={selectedOrder}
            onClose={() => setSelectedOrderId(null)}
            onAssign={() => setShowAssignModal(true)}
            onSchedule={() => setShowScheduleModal(true)}
            onComplete={handleCompleteOrder}
            onCreateInvoice={handleCreateInvoice}
            onSendInvoice={handleSendInvoice}
            onMarkPaid={handleMarkPaid}
          />
        </div>
      </div>

      {/* Modals */}
      <AssignModal
        open={showAssignModal}
        order={selectedOrder}
        technicians={uiTechnicians}
        onClose={() => setShowAssignModal(false)}
        onAssign={handleAssignTechnician}
      />

      <ScheduleModal
        open={showScheduleModal}
        order={selectedOrder}
        technicians={uiTechnicians}
        onClose={() => setShowScheduleModal(false)}
        onSchedule={handleScheduleJob}
      />

      {/* Notification Toast */}
      {notification && (
        <NotificationToast
          type={notification.type}
          message={notification.message}
          onDismiss={() => setNotification(null)}
        />
      )}
    </div>
  );
}
