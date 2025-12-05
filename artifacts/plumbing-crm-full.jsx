import { useState, useEffect, useCallback } from 'react';

// =============================================================================
// CONFIGURATION - Update these for your n8n setup
// =============================================================================
const N8N_CONFIG = {
  // Your n8n webhook URL that receives scraped work orders
  WEBHOOK_URL: 'https://your-n8n-instance.com/webhook/work-orders',
  // Polling interval in ms (set to 0 to disable polling, use WebSocket instead)
  POLL_INTERVAL: 30000,
  // API endpoint to send work order updates back to n8n
  UPDATE_ENDPOINT: 'https://your-n8n-instance.com/webhook/work-order-update',
};

// =============================================================================
// MOCK DATA - Replace with real API calls
// =============================================================================
const initialWorkOrders = [
  {
    id: 'WO-2024-001',
    customer: 'Sarah Mitchell',
    address: '1247 Oak Valley Drive, Austin, TX 78704',
    lat: 30.2412,
    lng: -97.7687,
    phone: '(512) 555-0147',
    email: 'sarah.m@email.com',
    issue: 'Leaking kitchen faucet - water pooling under sink cabinet',
    priority: 'high',
    status: 'new',
    source: 'Email Scrape',
    receivedAt: '2024-12-04T09:23:00',
    scheduledFor: null,
    estimatedValue: 185,
    notes: 'Customer mentioned possible water damage to cabinet floor'
  },
  {
    id: 'WO-2024-002',
    customer: 'Marcus Chen',
    address: '892 Riverside Blvd, Apt 4B, Austin, TX 78701',
    lat: 30.2621,
    lng: -97.7382,
    phone: '(512) 555-0293',
    email: 'mchen@techcorp.com',
    issue: 'Water heater not producing hot water - 8 year old unit',
    priority: 'medium',
    status: 'in_progress',
    source: 'Email Scrape',
    receivedAt: '2024-12-04T07:15:00',
    scheduledFor: '2024-12-04T14:00:00',
    assignedTo: 'Mike Rodriguez',
    estimatedValue: 450,
    notes: 'May need full replacement - quote for both repair and replace'
  },
  {
    id: 'WO-2024-003',
    customer: 'Downtown Coffee Co.',
    address: '156 Congress Ave, Austin, TX 78701',
    lat: 30.2672,
    lng: -97.7431,
    phone: '(512) 555-0812',
    email: 'manager@downtowncoffee.com',
    issue: 'Commercial dishwasher drain backing up during peak hours',
    priority: 'high',
    status: 'in_progress',
    source: 'Email Scrape',
    receivedAt: '2024-12-03T16:45:00',
    scheduledFor: '2024-12-04T06:00:00',
    assignedTo: 'Jake Thompson',
    estimatedValue: 320,
    notes: 'Commercial account - priority service agreement'
  },
  {
    id: 'WO-2024-004',
    customer: 'Robert & Linda Hayes',
    address: '3421 Sunset Ridge, Austin, TX 78745',
    lat: 30.2102,
    lng: -97.8012,
    phone: '(512) 555-0456',
    email: 'hayesfamily@gmail.com',
    issue: 'Main line sewer backup - multiple drains affected',
    priority: 'urgent',
    status: 'new',
    source: 'Email Scrape',
    receivedAt: '2024-12-04T10:02:00',
    scheduledFor: null,
    estimatedValue: 650,
    notes: 'URGENT - sewage smell reported, potential health hazard'
  },
  {
    id: 'WO-2024-005',
    customer: 'Jennifer Walsh',
    address: '7890 Meadow Lane, Austin, TX 78749',
    lat: 30.1921,
    lng: -97.8234,
    phone: '(512) 555-0634',
    email: 'jwalsh@email.com',
    issue: 'Toilet running continuously - high water bill concern',
    priority: 'low',
    status: 'completed',
    source: 'Email Scrape',
    receivedAt: '2024-12-03T11:30:00',
    scheduledFor: '2024-12-03T15:00:00',
    completedAt: '2024-12-03T16:15:00',
    assignedTo: 'Mike Rodriguez',
    estimatedValue: 125,
    actualValue: 95,
    notes: 'Replaced flapper valve - simple fix',
    invoice: {
      id: 'INV-2024-005',
      items: [
        { description: 'Flapper valve replacement', qty: 1, rate: 45 },
        { description: 'Labor (1 hr)', qty: 1, rate: 50 }
      ],
      status: 'paid'
    }
  },
  {
    id: 'WO-2024-006',
    customer: 'Greenview Apartments',
    address: '2100 E 6th Street, Austin, TX 78702',
    lat: 30.2598,
    lng: -97.7214,
    phone: '(512) 555-0999',
    email: 'maintenance@greenviewapts.com',
    issue: 'Unit 12C - garbage disposal jammed and making grinding noise',
    priority: 'medium',
    status: 'completed',
    source: 'Email Scrape',
    receivedAt: '2024-12-02T14:20:00',
    scheduledFor: '2024-12-03T09:00:00',
    completedAt: '2024-12-03T10:30:00',
    assignedTo: 'Jake Thompson',
    estimatedValue: 175,
    actualValue: 175,
    notes: 'Cleared obstruction, tested operation - working normally',
    invoice: {
      id: 'INV-2024-006',
      items: [
        { description: 'Disposal repair/clearing', qty: 1, rate: 95 },
        { description: 'Labor (1 hr)', qty: 1, rate: 80 }
      ],
      status: 'sent'
    }
  }
];

const technicians = [
  { id: 1, name: 'Mike Rodriguez', phone: '(512) 555-1001', status: 'on_job', currentJob: 'WO-2024-002', color: '#3b82f6' },
  { id: 2, name: 'Jake Thompson', phone: '(512) 555-1002', status: 'on_job', currentJob: 'WO-2024-003', color: '#22c55e' },
  { id: 3, name: 'Carlos Mendez', phone: '(512) 555-1003', status: 'available', currentJob: null, color: '#a855f7' },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function PlumbingCRM() {
  const [workOrders, setWorkOrders] = useState(initialWorkOrders);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeView, setActiveView] = useState('orders'); // orders, schedule, map, invoices
  const [activeTab, setActiveTab] = useState('all');
  const [webhookStatus, setWebhookStatus] = useState('connected');
  const [lastWebhookPing, setLastWebhookPing] = useState(new Date());
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [webhookLog, setWebhookLog] = useState([]);

  // ---------------------------------------------------------------------------
  // N8N WEBHOOK INTEGRATION
  // ---------------------------------------------------------------------------
  
  // Function to fetch new work orders from n8n
  const fetchWorkOrders = useCallback(async () => {
    try {
      // In production, replace with actual fetch:
      // const response = await fetch(N8N_CONFIG.WEBHOOK_URL);
      // const newOrders = await response.json();
      
      // Simulate receiving a new work order occasionally
      const shouldSimulate = Math.random() > 0.8;
      if (shouldSimulate) {
        const newOrder = {
          id: `WO-2024-${String(workOrders.length + 1).padStart(3, '0')}`,
          customer: 'New Customer (Simulated)',
          address: '123 Demo Street, Austin, TX 78701',
          lat: 30.25 + (Math.random() * 0.05),
          lng: -97.75 + (Math.random() * 0.05),
          phone: '(512) 555-0000',
          email: 'demo@test.com',
          issue: 'Simulated work order from n8n webhook',
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          status: 'new',
          source: 'Email Scrape',
          receivedAt: new Date().toISOString(),
          scheduledFor: null,
          estimatedValue: Math.floor(Math.random() * 400) + 100,
          notes: 'Auto-generated via n8n email scraper'
        };
        
        setWorkOrders(prev => [newOrder, ...prev]);
        setNotification({ type: 'success', message: `New work order received: ${newOrder.id}` });
        addToWebhookLog('RECEIVED', newOrder.id, 'New work order from email scrape');
      }
      
      setLastWebhookPing(new Date());
      setWebhookStatus('connected');
    } catch (error) {
      setWebhookStatus('error');
      addToWebhookLog('ERROR', null, error.message);
    }
  }, [workOrders.length]);

  // Function to send updates back to n8n
  const sendUpdateToN8N = async (orderId, updateType, data) => {
    try {
      // In production:
      // await fetch(N8N_CONFIG.UPDATE_ENDPOINT, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ orderId, updateType, data, timestamp: new Date().toISOString() })
      // });
      
      addToWebhookLog('SENT', orderId, `${updateType}: ${JSON.stringify(data).slice(0, 50)}...`);
      console.log('Sending to n8n:', { orderId, updateType, data });
    } catch (error) {
      addToWebhookLog('ERROR', orderId, `Failed to send update: ${error.message}`);
    }
  };

  const addToWebhookLog = (type, orderId, message) => {
    setWebhookLog(prev => [{
      timestamp: new Date(),
      type,
      orderId,
      message
    }, ...prev].slice(0, 50));
  };

  // Polling for new work orders
  useEffect(() => {
    if (N8N_CONFIG.POLL_INTERVAL > 0) {
      const interval = setInterval(fetchWorkOrders, N8N_CONFIG.POLL_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [fetchWorkOrders]);

  // Clear notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ---------------------------------------------------------------------------
  // STATS CALCULATION
  // ---------------------------------------------------------------------------
  const stats = {
    new: workOrders.filter(wo => wo.status === 'new').length,
    inProgress: workOrders.filter(wo => wo.status === 'in_progress').length,
    completed: workOrders.filter(wo => wo.status === 'completed').length,
    todayRevenue: workOrders
      .filter(wo => wo.status === 'completed' && wo.actualValue)
      .reduce((sum, wo) => sum + wo.actualValue, 0),
    pendingValue: workOrders
      .filter(wo => wo.status !== 'completed')
      .reduce((sum, wo) => sum + wo.estimatedValue, 0),
    unpaidInvoices: workOrders
      .filter(wo => wo.invoice && wo.invoice.status !== 'paid')
      .reduce((sum, wo) => sum + (wo.actualValue || wo.estimatedValue), 0)
  };

  const filteredOrders = activeTab === 'all' 
    ? workOrders 
    : workOrders.filter(wo => wo.status === activeTab);

  // ---------------------------------------------------------------------------
  // HELPER FUNCTIONS
  // ---------------------------------------------------------------------------
  const getPriorityStyles = (priority) => {
    const styles = {
      urgent: { bg: '#7f1d1d', border: '#dc2626', text: '#fca5a5', label: 'URGENT' },
      high: { bg: '#78350f', border: '#f59e0b', text: '#fcd34d', label: 'HIGH' },
      medium: { bg: '#1e3a5f', border: '#3b82f6', text: '#93c5fd', label: 'MEDIUM' },
      low: { bg: '#1a2e1a', border: '#22c55e', text: '#86efac', label: 'LOW' }
    };
    return styles[priority] || styles.medium;
  };

  const getStatusStyles = (status) => {
    const styles = {
      new: { bg: '#d97706', text: '#fff', label: 'NEW' },
      in_progress: { bg: '#2563eb', text: '#fff', label: 'IN PROGRESS' },
      completed: { bg: '#16a34a', text: '#fff', label: 'COMPLETED' }
    };
    return styles[status] || styles.new;
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // ---------------------------------------------------------------------------
  // ACTION HANDLERS
  // ---------------------------------------------------------------------------
  const updateOrderStatus = (orderId, newStatus, additionalData = {}) => {
    setWorkOrders(prev => prev.map(wo => 
      wo.id === orderId ? { ...wo, status: newStatus, ...additionalData } : wo
    ));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status: newStatus, ...additionalData }));
    }
    sendUpdateToN8N(orderId, 'STATUS_UPDATE', { newStatus, ...additionalData });
    setNotification({ type: 'success', message: `Order ${orderId} updated to ${newStatus}` });
  };

  const assignTechnician = (orderId, techName) => {
    const scheduledFor = new Date();
    scheduledFor.setHours(scheduledFor.getHours() + 2);
    
    updateOrderStatus(orderId, 'in_progress', { 
      assignedTo: techName, 
      scheduledFor: scheduledFor.toISOString() 
    });
    setShowAssignModal(false);
  };

  const scheduleOrder = (orderId, scheduledDateTime, techName) => {
    updateOrderStatus(orderId, 'in_progress', {
      scheduledFor: scheduledDateTime,
      assignedTo: techName
    });
    setShowScheduleModal(false);
  };

  const createInvoice = (order) => {
    const invoice = {
      id: `INV-${order.id.replace('WO-', '')}`,
      items: [
        { description: 'Service Call', qty: 1, rate: 75 },
        { description: 'Labor', qty: 2, rate: 50 },
        { description: 'Parts/Materials', qty: 1, rate: order.estimatedValue - 175 }
      ],
      status: 'draft'
    };
    
    setWorkOrders(prev => prev.map(wo => 
      wo.id === order.id ? { ...wo, invoice, actualValue: order.estimatedValue } : wo
    ));
    if (selectedOrder?.id === order.id) {
      setSelectedOrder(prev => ({ ...prev, invoice, actualValue: order.estimatedValue }));
    }
    sendUpdateToN8N(order.id, 'INVOICE_CREATED', invoice);
    setNotification({ type: 'success', message: `Invoice ${invoice.id} created` });
  };

  const sendInvoice = (order) => {
    const updatedInvoice = { ...order.invoice, status: 'sent', sentAt: new Date().toISOString() };
    setWorkOrders(prev => prev.map(wo => 
      wo.id === order.id ? { ...wo, invoice: updatedInvoice } : wo
    ));
    if (selectedOrder?.id === order.id) {
      setSelectedOrder(prev => ({ ...prev, invoice: updatedInvoice }));
    }
    sendUpdateToN8N(order.id, 'INVOICE_SENT', { invoiceId: updatedInvoice.id, email: order.email });
    setNotification({ type: 'success', message: `Invoice sent to ${order.email}` });
  };

  const markInvoicePaid = (order) => {
    const updatedInvoice = { ...order.invoice, status: 'paid', paidAt: new Date().toISOString() };
    setWorkOrders(prev => prev.map(wo => 
      wo.id === order.id ? { ...wo, invoice: updatedInvoice } : wo
    ));
    if (selectedOrder?.id === order.id) {
      setSelectedOrder(prev => ({ ...prev, invoice: updatedInvoice }));
    }
    sendUpdateToN8N(order.id, 'PAYMENT_RECEIVED', { invoiceId: updatedInvoice.id, amount: order.actualValue });
    setNotification({ type: 'success', message: `Payment recorded for ${updatedInvoice.id}` });
  };

  // ---------------------------------------------------------------------------
  // RENDER HELPERS
  // ---------------------------------------------------------------------------
  const renderNavItem = (view, icon, label, badge = null) => (
    <button
      onClick={() => setActiveView(view)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        width: '100%',
        border: 'none',
        borderRadius: '8px',
        background: activeView === view ? 'rgba(217, 119, 6, 0.2)' : 'transparent',
        color: activeView === view ? '#fbbf24' : '#7d8590',
        fontSize: '14px',
        fontWeight: activeView === view ? 600 : 400,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s',
        position: 'relative'
      }}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span>
      {label}
      {badge !== null && badge > 0 && (
        <span style={{
          marginLeft: 'auto',
          background: '#dc2626',
          color: '#fff',
          padding: '2px 8px',
          borderRadius: '10px',
          fontSize: '11px',
          fontWeight: 700
        }}>{badge}</span>
      )}
    </button>
  );

  // ---------------------------------------------------------------------------
  // MAIN RENDER
  // ---------------------------------------------------------------------------
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f1419 0%, #1a2332 50%, #0d1117 100%)',
      fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#e6edf3',
      display: 'flex'
    }}>
      {/* Blueprint grid overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(56, 139, 166, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(56, 139, 166, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Notification Toast */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '16px 24px',
          background: notification.type === 'success' ? 'rgba(22, 163, 74, 0.95)' : 'rgba(220, 38, 38, 0.95)',
          borderRadius: '10px',
          color: '#fff',
          fontWeight: 600,
          zIndex: 1000,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          animation: 'slideIn 0.3s ease'
        }}>
          {notification.message}
        </div>
      )}

      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: 'rgba(13, 17, 23, 0.95)',
        borderRight: '1px solid #30363d',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', padding: '0 8px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            background: 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #b45309 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)',
            border: '1px solid #ca8a04'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#f0f6fc', margin: 0 }}>FlowControl</h1>
            <p style={{ fontSize: '11px', color: '#7d8590', margin: 0, letterSpacing: '0.5px' }}>PLUMBING CRM</p>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {renderNavItem('orders', '📋', 'Work Orders', stats.new)}
          {renderNavItem('schedule', '📅', 'Schedule')}
          {renderNavItem('map', '🗺️', 'Route Map')}
          {renderNavItem('invoices', '💰', 'Invoices', workOrders.filter(wo => wo.invoice?.status === 'sent').length)}
          {renderNavItem('webhook', '🔗', 'Webhook Log')}
        </nav>

        {/* Webhook Status */}
        <div style={{ marginTop: 'auto', padding: '16px', background: 'rgba(22, 27, 34, 0.6)', borderRadius: '10px', border: '1px solid #30363d' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: webhookStatus === 'connected' ? '#22c55e' : '#ef4444',
              boxShadow: `0 0 8px ${webhookStatus === 'connected' ? '#22c55e' : '#ef4444'}`,
              animation: 'pulse 2s infinite'
            }} />
            <span style={{ fontSize: '12px', color: webhookStatus === 'connected' ? '#86efac' : '#fca5a5', fontWeight: 600 }}>
              n8n {webhookStatus === 'connected' ? 'Connected' : 'Error'}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#7d8590' }}>
            Last ping: {formatTime(lastWebhookPing)}
          </div>
          <div style={{ fontSize: '10px', color: '#7d8590', marginTop: '4px', fontFamily: 'monospace' }}>
            Polling: {N8N_CONFIG.POLL_INTERVAL / 1000}s
          </div>
        </div>

        {/* Technicians Status */}
        <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(22, 27, 34, 0.6)', borderRadius: '10px', border: '1px solid #30363d' }}>
          <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#7d8590', margin: '0 0 12px 0' }}>
            Crew Status
          </h4>
          {technicians.map(tech => (
            <div key={tech.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: tech.status === 'available' ? '#22c55e' : '#f59e0b'
              }} />
              <span style={{ fontSize: '12px', color: '#b1bac4', flex: 1 }}>{tech.name}</span>
              <span style={{ fontSize: '10px', color: '#7d8590' }}>
                {tech.status === 'available' ? 'Free' : 'Busy'}
              </span>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <header style={{
          padding: '16px 32px',
          borderBottom: '1px solid #30363d',
          background: 'rgba(13, 17, 23, 0.8)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>
            {activeView === 'orders' && 'Work Orders'}
            {activeView === 'schedule' && 'Schedule'}
            {activeView === 'map' && 'Route Planning'}
            {activeView === 'invoices' && 'Invoices'}
            {activeView === 'webhook' && 'Webhook Activity Log'}
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{
              padding: '8px 16px',
              background: 'rgba(56, 139, 166, 0.1)',
              border: '1px solid #388ba6',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#7dd3fc'
            }}>
              ✉️ Email Pipeline Active
            </div>
            <button
              onClick={fetchWorkOrders}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
          {/* ===================== WORK ORDERS VIEW ===================== */}
          {activeView === 'orders' && (
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ flex: 1 }}>
                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  {[
                    { label: 'New', value: stats.new, color: '#d97706', icon: '📥' },
                    { label: 'In Progress', value: stats.inProgress, color: '#2563eb', icon: '🔧' },
                    { label: 'Completed', value: stats.completed, color: '#16a34a', icon: '✅' },
                    { label: 'Revenue', value: `$${stats.todayRevenue}`, color: '#22c55e', icon: '💰' },
                    { label: 'Pipeline', value: `$${stats.pendingValue}`, color: '#a855f7', icon: '📊' }
                  ].map((stat, i) => (
                    <div key={i} style={{
                      background: 'rgba(22, 27, 34, 0.8)',
                      border: '1px solid #30363d',
                      borderRadius: '12px',
                      padding: '16px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${stat.color}, transparent)` }} />
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{stat.icon}</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                      <div style={{ fontSize: '11px', color: '#7d8590', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(22, 27, 34, 0.6)', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
                  {[
                    { id: 'all', label: 'All', count: workOrders.length },
                    { id: 'new', label: 'New', count: stats.new },
                    { id: 'in_progress', label: 'In Progress', count: stats.inProgress },
                    { id: 'completed', label: 'Completed', count: stats.completed }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        background: activeTab === tab.id ? '#d97706' : 'transparent',
                        color: activeTab === tab.id ? '#fff' : '#7d8590',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {tab.label}
                      <span style={{
                        background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'rgba(125,133,144,0.2)',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: '10px'
                      }}>{tab.count}</span>
                    </button>
                  ))}
                </div>

                {/* Orders List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredOrders.map(order => {
                    const priority = getPriorityStyles(order.priority);
                    const status = getStatusStyles(order.status);
                    const isSelected = selectedOrder?.id === order.id;

                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        style={{
                          background: isSelected ? 'linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(22, 27, 34, 0.95) 100%)' : 'rgba(22, 27, 34, 0.8)',
                          border: `1px solid ${isSelected ? '#d97706' : '#30363d'}`,
                          borderRadius: '10px',
                          padding: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: priority.border }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginLeft: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#d97706', fontWeight: 600 }}>{order.id}</span>
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, background: priority.bg, color: priority.text, border: `1px solid ${priority.border}` }}>{priority.label}</span>
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, background: status.bg, color: status.text }}>{status.label}</span>
                            </div>
                            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f0f6fc', margin: '0 0 4px 0' }}>{order.customer}</h3>
                            <p style={{ fontSize: '13px', color: '#b1bac4', margin: 0, lineHeight: 1.4 }}>{order.issue}</p>
                            <div style={{ display: 'flex', gap: '14px', marginTop: '10px', fontSize: '11px', color: '#7d8590' }}>
                              <span>📍 {order.address.split(',')[0]}</span>
                              <span>⏰ {formatTime(order.receivedAt)}</span>
                              {order.assignedTo && <span>👷 {order.assignedTo}</span>}
                              <span style={{ color: '#22c55e' }}>💵 ${order.estimatedValue}</span>
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', color: '#7d8590' }}>{formatDate(order.receivedAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detail Panel */}
              <div style={{
                width: '380px',
                background: 'rgba(22, 27, 34, 0.9)',
                border: '1px solid #30363d',
                borderRadius: '14px',
                padding: '20px',
                height: 'fit-content',
                position: 'sticky',
                top: '24px',
                maxHeight: 'calc(100vh - 180px)',
                overflowY: 'auto'
              }}>
                {selectedOrder ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div>
                        <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#d97706' }}>{selectedOrder.id}</span>
                        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f0f6fc', margin: '4px 0 0 0' }}>{selectedOrder.customer}</h2>
                      </div>
                      <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', color: '#7d8590', cursor: 'pointer', fontSize: '20px' }}>×</button>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                      {selectedOrder.status === 'new' && (
                        <>
                          <button onClick={() => setShowAssignModal(true)} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>
                            👷 Assign
                          </button>
                          <button onClick={() => setShowScheduleModal(true)} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>
                            📅 Schedule
                          </button>
                        </>
                      )}
                      {selectedOrder.status === 'in_progress' && (
                        <button onClick={() => updateOrderStatus(selectedOrder.id, 'completed', { completedAt: new Date().toISOString() })} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>
                          ✅ Complete
                        </button>
                      )}
                      {selectedOrder.status === 'completed' && !selectedOrder.invoice && (
                        <button onClick={() => createInvoice(selectedOrder)} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>
                          💰 Create Invoice
                        </button>
                      )}
                      {selectedOrder.invoice?.status === 'draft' && (
                        <button onClick={() => sendInvoice(selectedOrder)} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>
                          📧 Send Invoice
                        </button>
                      )}
                      {selectedOrder.invoice?.status === 'sent' && (
                        <button onClick={() => markInvoicePaid(selectedOrder)} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>
                          💵 Mark Paid
                        </button>
                      )}
                    </div>

                    {/* Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <h4 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#7d8590', margin: '0 0 6px 0' }}>Issue</h4>
                        <p style={{ fontSize: '13px', color: '#b1bac4', margin: 0, background: 'rgba(13, 17, 23, 0.6)', padding: '10px', borderRadius: '6px', border: '1px solid #21262d' }}>{selectedOrder.issue}</p>
                      </div>

                      <div>
                        <h4 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#7d8590', margin: '0 0 6px 0' }}>Contact</h4>
                        <div style={{ background: 'rgba(13, 17, 23, 0.6)', padding: '10px', borderRadius: '6px', border: '1px solid #21262d', fontSize: '12px', color: '#b1bac4' }}>
                          <p style={{ margin: '0 0 6px 0' }}>📍 {selectedOrder.address}</p>
                          <p style={{ margin: '0 0 6px 0' }}>📞 {selectedOrder.phone}</p>
                          <p style={{ margin: 0 }}>✉️ {selectedOrder.email}</p>
                        </div>
                      </div>

                      {selectedOrder.notes && (
                        <div>
                          <h4 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#7d8590', margin: '0 0 6px 0' }}>Notes</h4>
                          <div style={{ background: 'rgba(217, 119, 6, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(217, 119, 6, 0.3)' }}>
                            <p style={{ margin: 0, fontSize: '12px', color: '#fcd34d', fontStyle: 'italic' }}>{selectedOrder.notes}</p>
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div style={{ background: 'rgba(13, 17, 23, 0.6)', padding: '10px', borderRadius: '6px', border: '1px solid #21262d' }}>
                          <div style={{ fontSize: '10px', color: '#7d8590', marginBottom: '2px' }}>Value</div>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: '#22c55e' }}>${selectedOrder.actualValue || selectedOrder.estimatedValue}</div>
                        </div>
                        <div style={{ background: 'rgba(13, 17, 23, 0.6)', padding: '10px', borderRadius: '6px', border: '1px solid #21262d' }}>
                          <div style={{ fontSize: '10px', color: '#7d8590', marginBottom: '2px' }}>Scheduled</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0f6fc' }}>{selectedOrder.scheduledFor ? formatDateTime(selectedOrder.scheduledFor) : 'Not set'}</div>
                        </div>
                      </div>

                      {selectedOrder.assignedTo && (
                        <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(37, 99, 235, 0.3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>👷</div>
                          <div>
                            <div style={{ fontSize: '10px', color: '#7d8590' }}>Assigned To</div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#93c5fd' }}>{selectedOrder.assignedTo}</div>
                          </div>
                        </div>
                      )}

                      {selectedOrder.invoice && (
                        <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#c4b5fd' }}>{selectedOrder.invoice.id}</span>
                            <span style={{
                              fontSize: '10px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: selectedOrder.invoice.status === 'paid' ? '#16a34a' : selectedOrder.invoice.status === 'sent' ? '#2563eb' : '#71717a',
                              color: '#fff',
                              fontWeight: 600
                            }}>
                              {selectedOrder.invoice.status.toUpperCase()}
                            </span>
                          </div>
                          {selectedOrder.invoice.items.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#a1a1aa', marginBottom: '4px' }}>
                              <span>{item.description}</span>
                              <span>${item.qty * item.rate}</span>
                            </div>
                          ))}
                          <div style={{ borderTop: '1px solid rgba(168, 85, 247, 0.3)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                            <span style={{ color: '#c4b5fd' }}>Total</span>
                            <span style={{ color: '#22c55e' }}>${selectedOrder.invoice.items.reduce((sum, i) => sum + i.qty * i.rate, 0)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '280px', color: '#7d8590', textAlign: 'center' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.5 }}>🔧</div>
                    <p style={{ margin: 0, fontSize: '13px' }}>Select a work order</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================== SCHEDULE VIEW ===================== */}
          {activeView === 'schedule' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {technicians.map(tech => {
                  const techOrders = workOrders.filter(wo => wo.assignedTo === tech.name && wo.status !== 'completed');
                  return (
                    <div key={tech.id} style={{ background: 'rgba(22, 27, 34, 0.8)', border: '1px solid #30363d', borderRadius: '12px', padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `linear-gradient(135deg, ${tech.color} 0%, ${tech.color}99 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👷</div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '16px', color: '#f0f6fc' }}>{tech.name}</h3>
                          <p style={{ margin: 0, fontSize: '12px', color: '#7d8590' }}>{tech.phone}</p>
                        </div>
                        <div style={{ marginLeft: 'auto', width: '10px', height: '10px', borderRadius: '50%', background: tech.status === 'available' ? '#22c55e' : '#f59e0b' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {techOrders.length === 0 ? (
                          <p style={{ fontSize: '13px', color: '#7d8590', textAlign: 'center', padding: '20px 0' }}>No scheduled jobs</p>
                        ) : (
                          techOrders.map(order => (
                            <div key={order.id} style={{ background: 'rgba(13, 17, 23, 0.6)', padding: '12px', borderRadius: '8px', border: '1px solid #21262d' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#d97706' }}>{order.id}</span>
                                <span style={{ fontSize: '11px', color: '#7d8590' }}>{order.scheduledFor ? formatDateTime(order.scheduledFor) : 'TBD'}</span>
                              </div>
                              <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#f0f6fc', fontWeight: 500 }}>{order.customer}</p>
                              <p style={{ margin: 0, fontSize: '11px', color: '#7d8590' }}>📍 {order.address.split(',')[0]}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================== MAP VIEW ===================== */}
          {activeView === 'map' && (
            <div style={{ background: 'rgba(22, 27, 34, 0.8)', border: '1px solid #30363d', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', gap: '24px' }}>
                {/* Map placeholder */}
                <div style={{ flex: 1, height: '500px', background: 'rgba(13, 17, 23, 0.8)', borderRadius: '10px', border: '1px solid #21262d', position: 'relative', overflow: 'hidden' }}>
                  {/* Grid for visual effect */}
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(56, 139, 166, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 139, 166, 0.1) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                  
                  {/* Map markers */}
                  {workOrders.filter(wo => wo.status !== 'completed' && wo.lat && wo.lng).map((order, i) => {
                    const priority = getPriorityStyles(order.priority);
                    const x = ((order.lng + 97.85) / 0.15) * 100;
                    const y = ((30.29 - order.lat) / 0.12) * 100;
                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        style={{
                          position: 'absolute',
                          left: `${Math.max(5, Math.min(90, x))}%`,
                          top: `${Math.max(5, Math.min(90, y))}%`,
                          transform: 'translate(-50%, -50%)',
                          cursor: 'pointer',
                          zIndex: 10
                        }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50% 50% 50% 0',
                          background: priority.border,
                          transform: 'rotate(-45deg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 4px 12px ${priority.border}66`
                        }}>
                          <span style={{ transform: 'rotate(45deg)', fontSize: '12px' }}>🔧</span>
                        </div>
                        <div style={{
                          position: 'absolute',
                          top: '40px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'rgba(13, 17, 23, 0.95)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          whiteSpace: 'nowrap',
                          fontSize: '10px',
                          color: '#f0f6fc',
                          border: '1px solid #30363d'
                        }}>
                          {order.customer.split(' ')[0]}
                        </div>
                      </div>
                    );
                  })}

                  {/* Legend */}
                  <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(13, 17, 23, 0.95)', padding: '12px', borderRadius: '8px', border: '1px solid #30363d' }}>
                    <div style={{ fontSize: '10px', color: '#7d8590', marginBottom: '8px', fontWeight: 600 }}>PRIORITY</div>
                    {['urgent', 'high', 'medium', 'low'].map(p => {
                      const style = getPriorityStyles(p);
                      return (
                        <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: style.border }} />
                          <span style={{ fontSize: '10px', color: '#b1bac4' }}>{style.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#7d8590' }}>
                    <p style={{ margin: 0, fontSize: '13px' }}>🗺️ Interactive map would integrate here</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px' }}>Connect to Google Maps or Mapbox API</p>
                  </div>
                </div>

                {/* Route list */}
                <div style={{ width: '280px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#f0f6fc' }}>Active Jobs Route</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {workOrders.filter(wo => wo.status !== 'completed').map((order, i) => {
                      const priority = getPriorityStyles(order.priority);
                      return (
                        <div key={order.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(13, 17, 23, 0.6)', borderRadius: '8px', border: '1px solid #21262d' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: priority.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff' }}>{i + 1}</div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '12px', color: '#f0f6fc', fontWeight: 500 }}>{order.customer}</p>
                            <p style={{ margin: 0, fontSize: '10px', color: '#7d8590' }}>{order.address.split(',')[0]}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== INVOICES VIEW ===================== */}
          {activeView === 'invoices' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Draft', value: workOrders.filter(wo => wo.invoice?.status === 'draft').length, color: '#71717a' },
                  { label: 'Sent', value: workOrders.filter(wo => wo.invoice?.status === 'sent').length, color: '#2563eb' },
                  { label: 'Paid', value: workOrders.filter(wo => wo.invoice?.status === 'paid').length, color: '#16a34a' }
                ].map((stat, i) => (
                  <div key={i} style={{ background: 'rgba(22, 27, 34, 0.8)', border: '1px solid #30363d', borderRadius: '10px', padding: '16px' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: '12px', color: '#7d8590' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {workOrders.filter(wo => wo.invoice).map(order => (
                  <div key={order.id} style={{ background: 'rgba(22, 27, 34, 0.8)', border: '1px solid #30363d', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div>
                        <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#a855f7', fontWeight: 600 }}>{order.invoice.id}</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#f0f6fc' }}>{order.customer}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#22c55e' }}>${order.actualValue}</div>
                      <span style={{
                        fontSize: '10px',
                        padding: '3px 10px',
                        borderRadius: '4px',
                        background: order.invoice.status === 'paid' ? '#16a34a' : order.invoice.status === 'sent' ? '#2563eb' : '#71717a',
                        color: '#fff',
                        fontWeight: 600
                      }}>
                        {order.invoice.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================== WEBHOOK LOG VIEW ===================== */}
          {activeView === 'webhook' && (
            <div style={{ background: 'rgba(22, 27, 34, 0.8)', border: '1px solid #30363d', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', color: '#f0f6fc' }}>Webhook Activity</h3>
                <div style={{ fontSize: '11px', color: '#7d8590', fontFamily: 'monospace' }}>
                  Endpoint: {N8N_CONFIG.WEBHOOK_URL.slice(0, 40)}...
                </div>
              </div>
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {webhookLog.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#7d8590', padding: '40px 0' }}>No webhook activity yet</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {webhookLog.map((log, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'rgba(13, 17, 23, 0.6)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: log.type === 'RECEIVED' ? 'rgba(34, 197, 94, 0.2)' : log.type === 'SENT' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: log.type === 'RECEIVED' ? '#86efac' : log.type === 'SENT' ? '#93c5fd' : '#fca5a5',
                          fontWeight: 600
                        }}>
                          {log.type}
                        </span>
                        <span style={{ color: '#d97706' }}>{log.orderId || '--'}</span>
                        <span style={{ color: '#7d8590', flex: 1 }}>{log.message}</span>
                        <span style={{ color: '#52525b' }}>{formatTime(log.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ===================== MODALS ===================== */}
      
      {/* Assign Modal */}
      {showAssignModal && selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAssignModal(false)}>
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '14px', padding: '24px', width: '340px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px 0', color: '#f0f6fc', fontSize: '16px' }}>Assign Technician</h3>
            {technicians.map(tech => (
              <button
                key={tech.id}
                onClick={() => assignTechnician(selectedOrder.id, tech.name)}
                disabled={tech.status === 'on_job'}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  marginBottom: '8px',
                  background: tech.status === 'available' ? 'rgba(22, 163, 74, 0.15)' : 'rgba(125, 133, 144, 0.1)',
                  border: `1px solid ${tech.status === 'available' ? '#22c55e' : '#30363d'}`,
                  borderRadius: '8px',
                  color: tech.status === 'available' ? '#86efac' : '#7d8590',
                  textAlign: 'left',
                  cursor: tech.status === 'available' ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px'
                }}
              >
                <span>{tech.name}</span>
                <span style={{ fontSize: '11px' }}>{tech.status === 'available' ? '🟢 Available' : '🟡 On Job'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowScheduleModal(false)}>
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '14px', padding: '24px', width: '360px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px 0', color: '#f0f6fc', fontSize: '16px' }}>Schedule Job</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const dateTime = `${formData.get('date')}T${formData.get('time')}:00`;
              scheduleOrder(selectedOrder.id, dateTime, formData.get('tech'));
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#7d8590', marginBottom: '6px' }}>Date</label>
                <input type="date" name="date" required style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', color: '#f0f6fc', fontSize: '14px' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#7d8590', marginBottom: '6px' }}>Time</label>
                <input type="time" name="time" required style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', color: '#f0f6fc', fontSize: '14px' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#7d8590', marginBottom: '6px' }}>Technician</label>
                <select name="tech" required style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', color: '#f0f6fc', fontSize: '14px' }}>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.name}>{tech.name} {tech.status === 'available' ? '(Available)' : '(Busy)'}</option>
                  ))}
                </select>
              </div>
              <button type="submit" style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
                Schedule
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #484f58; }
      `}</style>
    </div>
  );
}