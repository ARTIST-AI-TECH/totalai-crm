import { WorkOrder, Technician } from './types';

// =============================================================================
// N8N CONFIGURATION
// =============================================================================
export const webhookConfig = {
  // Your n8n webhook URL that receives scraped work orders
  WEBHOOK_URL: 'https://your-n8n-instance.com/webhook/work-orders',
  // Polling interval in ms (set to 0 to disable polling, use WebSocket instead)
  POLL_INTERVAL: 30000,
  // API endpoint to send work order updates back to n8n
  UPDATE_ENDPOINT: 'https://your-n8n-instance.com/webhook/work-order-update',
};

// =============================================================================
// MOCK WORK ORDERS
// =============================================================================
export const initialWorkOrders: WorkOrder[] = [
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
      status: 'paid',
      paidAt: '2024-12-03T17:00:00'
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
      status: 'sent',
      sentAt: '2024-12-03T11:00:00'
    }
  }
];

// =============================================================================
// MOCK TECHNICIANS
// =============================================================================
export const technicians: Technician[] = [
  {
    id: 1,
    name: 'Mike Rodriguez',
    phone: '(512) 555-1001',
    status: 'on_job',
    currentJob: 'WO-2024-002',
    color: '#3b82f6'
  },
  {
    id: 2,
    name: 'Jake Thompson',
    phone: '(512) 555-1002',
    status: 'on_job',
    currentJob: 'WO-2024-003',
    color: '#22c55e'
  },
  {
    id: 3,
    name: 'Carlos Mendez',
    phone: '(512) 555-1003',
    status: 'available',
    currentJob: null,
    color: '#a855f7'
  },
];

// =============================================================================
// MOCK WEBHOOK LOGS
// =============================================================================
export const initialWebhookLogs = [
  {
    timestamp: new Date('2024-12-04T10:02:15'),
    type: 'RECEIVED' as const,
    orderId: 'WO-2024-004',
    message: 'New work order received from email scraper'
  },
  {
    timestamp: new Date('2024-12-04T10:02:17'),
    type: 'SENT' as const,
    orderId: 'WO-2024-004',
    message: 'Work order created in CRM, sent acknowledgment to n8n'
  },
  {
    timestamp: new Date('2024-12-04T09:23:10'),
    type: 'RECEIVED' as const,
    orderId: 'WO-2024-001',
    message: 'New work order received from email scraper'
  },
  {
    timestamp: new Date('2024-12-04T09:23:12'),
    type: 'SENT' as const,
    orderId: 'WO-2024-001',
    message: 'Work order created in CRM, sent acknowledgment to n8n'
  },
  {
    timestamp: new Date('2024-12-04T07:15:45'),
    type: 'SENT' as const,
    orderId: 'WO-2024-002',
    message: 'Status update: Work order assigned to Mike Rodriguez'
  },
];
