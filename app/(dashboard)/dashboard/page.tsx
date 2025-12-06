'use client';

import { useState } from 'react';
import { OrderFilters } from '@/components/crm/orders/order-filters';
import { WorkOrderList } from '@/components/crm/orders/work-order-list';
import { WorkOrderDetail } from '@/components/crm/orders/work-order-detail';
import { AssignModal } from '@/components/crm/orders/assign-modal';
import { ScheduleModal } from '@/components/crm/orders/schedule-modal';
import { NotificationToast } from '@/components/crm/shared/notification-toast';
import { initialWorkOrders, technicians } from '@/lib/crm/mock-data';
import { WorkOrder } from '@/lib/crm/types';
import {
  getNewOrdersCount,
  getInProgressCount,
  getCompletedTodayCount,
  getTodayRevenue,
  getPipelineValue,
} from '@/lib/crm/utils';

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(initialWorkOrders);
  // Select first order by default (inbox-style)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    initialWorkOrders.length > 0 ? initialWorkOrders[0].id : null
  );
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const selectedOrder = workOrders.find((order) => order.id === selectedOrderId) || null;

  // Calculate stats
  const newCount = getNewOrdersCount(workOrders);
  const inProgressCount = getInProgressCount(workOrders);
  const completedCount = getCompletedTodayCount(workOrders);
  const todayRevenue = getTodayRevenue(workOrders);
  const pipelineValue = getPipelineValue(workOrders);

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
    // Mark as read
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

    // Create a simple invoice
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

  return (
    <div className="space-y-6 py-6">
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
        technicians={technicians}
        onClose={() => setShowAssignModal(false)}
        onAssign={handleAssignTechnician}
      />

      <ScheduleModal
        open={showScheduleModal}
        order={selectedOrder}
        technicians={technicians}
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
