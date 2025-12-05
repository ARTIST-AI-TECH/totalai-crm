# FlowControl CRM - Build Specification

## Project Overview

Transform this Next.js starter repository into a lite CRM for a plumbing company. The application receives work orders via n8n webhooks (from scraped marketplace emails), manages the work order lifecycle, handles technician assignment and scheduling, generates invoices, and syncs status updates back to external systems.

### Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database:** Supabase (Postgres)
- **ORM:** Drizzle ORM
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **Real-time:** Supabase Realtime subscriptions
- **Auth:** Supabase Auth

### Reference Artifacts

The following artifacts are included in this repository for reference:

1. `artifacts/plumbing-crm-full.jsx` - Complete React UI prototype with all views, state management, and component structure
2. `artifacts/n8n-work-order-pipeline.json` - n8n workflow that sends webhooks to this application

Use these as the source of truth for UI design, data structures, and integration points.

---

## Database Schema

### Create the following Drizzle schema in `src/db/schema.ts`:

```typescript
import { pgTable, uuid, text, timestamp, numeric, pgEnum, jsonb } from 'drizzle-orm/pg-core';

// Enums
export const workOrderStatusEnum = pgEnum('work_order_status', ['new', 'in_progress', 'completed', 'cancelled']);
export const priorityEnum = pgEnum('priority', ['urgent', 'high', 'medium', 'low']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue']);
export const technicianStatusEnum = pgEnum('technician_status', ['available', 'on_job', 'off_duty']);

// Work Orders
export const workOrders = pgTable('work_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  displayId: text('display_id').notNull().unique(), // "WO-2024-001"
  externalId: text('external_id'), // Marketplace's ID
  
  // Customer info
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email'),
  customerPhone: text('customer_phone'),
  
  // Location
  address: text('address').notNull(),
  latitude: numeric('latitude', { precision: 10, scale: 7 }),
  longitude: numeric('longitude', { precision: 10, scale: 7 }),
  
  // Job details
  issue: text('issue').notNull(),
  notes: text('notes'),
  priority: priorityEnum('priority').default('medium').notNull(),
  status: workOrderStatusEnum('status').default('new').notNull(),
  
  // Source tracking
  source: text('source').default('manual'), // 'Email Scrape', 'Phone', 'Walk-in', 'manual'
  sourceUrl: text('source_url'),
  
  // Financials
  estimatedValue: numeric('estimated_value', { precision: 10, scale: 2 }),
  actualValue: numeric('actual_value', { precision: 10, scale: 2 }),
  
  // Assignment
  assignedToId: uuid('assigned_to_id').references(() => technicians.id),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  
  // Timestamps
  receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Technicians
export const technicians = pgTable('technicians', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique(),
  phone: text('phone'),
  status: technicianStatusEnum('status').default('available').notNull(),
  color: text('color').default('#3b82f6'), // For UI display
  currentJobId: uuid('current_job_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Invoices
export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  displayId: text('display_id').notNull().unique(), // "INV-2024-001"
  workOrderId: uuid('work_order_id').references(() => workOrders.id).notNull(),
  
  status: invoiceStatusEnum('status').default('draft').notNull(),
  
  // Line items stored as JSONB
  lineItems: jsonb('line_items').$type<InvoiceLineItem[]>().default([]),
  
  // Totals
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }),
  tax: numeric('tax', { precision: 10, scale: 2 }),
  total: numeric('total', { precision: 10, scale: 2 }),
  
  // Timestamps
  sentAt: timestamp('sent_at', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Webhook Log - for debugging n8n integration
export const webhookLogs = pgTable('webhook_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type').notNull(), // 'RECEIVED', 'SENT', 'ERROR'
  workOrderId: uuid('work_order_id').references(() => workOrders.id),
  message: text('message'),
  payload: jsonb('payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Type for invoice line items
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}
```

### Database Migrations

Generate and run migrations:

```bash
npx drizzle-kit generate:pg
npx drizzle-kit push:pg
```

### Seed Data

Create `src/db/seed.ts` with initial technicians:

```typescript
const seedTechnicians = [
  { name: 'Mike Rodriguez', phone: '(512) 555-1001', status: 'available', color: '#3b82f6' },
  { name: 'Jake Thompson', phone: '(512) 555-1002', status: 'available', color: '#22c55e' },
  { name: 'Carlos Mendez', phone: '(512) 555-1003', status: 'available', color: '#a855f7' },
];
```

---

## Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database (for Drizzle)
DATABASE_URL=your_supabase_postgres_connection_string

# n8n Integration
N8N_WEBHOOK_SECRET=your_shared_secret_for_webhook_validation
N8N_UPDATE_ENDPOINT=https://your-n8n-instance.com/webhook/work-order-update

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## API Routes

### Create the following API routes in `src/app/api/`:

#### 1. Webhook Receiver: `api/webhooks/work-orders/route.ts`

This endpoint receives new work orders from n8n.

**Responsibilities:**
- Validate webhook secret header (`X-Webhook-Secret`)
- Parse incoming work order payload
- Generate sequential `displayId` (WO-YYYY-XXX format)
- Insert into database
- Log to webhook_logs table
- Return success/error response

**Expected Payload from n8n:**
```typescript
interface IncomingWorkOrder {
  id?: string;
  externalId?: string;
  customer: string;
  address: string;
  phone?: string;
  email?: string;
  issue: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'new';
  source: string;
  sourceUrl?: string;
  receivedAt: string;
  scheduledFor?: string | null;
  estimatedValue?: number;
  notes?: string;
}
```

#### 2. Work Orders CRUD: `api/work-orders/route.ts`

**GET:** List work orders with filtering
- Query params: `status`, `priority`, `assignedTo`, `limit`, `offset`
- Include related technician data
- Sort by receivedAt descending

**POST:** Create work order manually
- Generate displayId
- Validate required fields

#### 3. Single Work Order: `api/work-orders/[id]/route.ts`

**GET:** Get single work order with all relations

**PATCH:** Update work order
- Handle status transitions
- When status changes to 'in_progress', update technician status
- When status changes to 'completed', set completedAt, free up technician
- Trigger n8n notification on status change (see below)

**DELETE:** Soft delete or hard delete work order

#### 4. Work Order Assignment: `api/work-orders/[id]/assign/route.ts`

**POST:** Assign technician to work order
- Update work order with assignedToId and scheduledFor
- Update technician status to 'on_job' and set currentJobId
- Change work order status to 'in_progress'
- Notify n8n of assignment

#### 5. Technicians: `api/technicians/route.ts`

**GET:** List all technicians with current job info
**POST:** Create new technician
**PATCH:** Update technician status

#### 6. Invoices: `api/invoices/route.ts`

**GET:** List invoices with filtering by status
**POST:** Create invoice for completed work order

#### 7. Single Invoice: `api/invoices/[id]/route.ts`

**GET:** Get invoice with work order details
**PATCH:** Update invoice (add line items, change status)

#### 8. Invoice Actions: `api/invoices/[id]/send/route.ts`

**POST:** Mark invoice as sent
- Update status to 'sent'
- Set sentAt timestamp
- Trigger n8n to send email (via webhook)

#### 9. Invoice Payment: `api/invoices/[id]/pay/route.ts`

**POST:** Mark invoice as paid
- Update status to 'paid'
- Set paidAt timestamp
- Update work order actualValue
- Notify n8n of payment received

#### 10. n8n Sync: `api/webhooks/n8n-sync/route.ts`

**Outbound webhook helper** - Call this internally to notify n8n of changes:

```typescript
async function notifyN8N(type: string, payload: any) {
  await fetch(process.env.N8N_UPDATE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET,
    },
    body: JSON.stringify({
      type, // 'STATUS_UPDATE', 'ASSIGNMENT', 'INVOICE_CREATED', 'INVOICE_SENT', 'PAYMENT_RECEIVED'
      payload,
      timestamp: new Date().toISOString(),
    }),
  });
}
```

#### 11. Dashboard Stats: `api/stats/route.ts`

**GET:** Return aggregated statistics
```typescript
interface DashboardStats {
  newCount: number;
  inProgressCount: number;
  completedCount: number;
  todayRevenue: number;
  pipelineValue: number;
  unpaidInvoices: number;
}
```

#### 12. Webhook Logs: `api/webhook-logs/route.ts`

**GET:** Return recent webhook activity for debugging view

---

## Page Structure

### Create the following pages using App Router:

```
src/app/
├── (dashboard)/
│   ├── layout.tsx          # Dashboard layout with sidebar
│   ├── page.tsx            # Redirects to /orders
│   ├── orders/
│   │   └── page.tsx        # Work orders list view (main view)
│   ├── schedule/
│   │   └── page.tsx        # Technician schedule view
│   ├── map/
│   │   └── page.tsx        # Route planning map view
│   ├── invoices/
│   │   └── page.tsx        # Invoices management view
│   └── webhooks/
│       └── page.tsx        # Webhook activity log view
├── api/
│   └── [... as defined above]
└── layout.tsx              # Root layout
```

---

## UI Components

### Adapt the reference artifact UI using shadcn components:

#### Required shadcn Components (install these):

```bash
npx shadcn-ui@latest add card
npx shadcn-ui@latest add button
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add table
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add popover
```

#### Custom Components to Create in `src/components/`:

| Component | Purpose | Reference in Artifact |
|-----------|---------|----------------------|
| `Sidebar` | Navigation sidebar with logo, nav items, webhook status, crew status | Lines 350-450 in artifact |
| `StatsCard` | Individual stat display card | Lines 500-520 |
| `StatsRow` | Row of 5 stat cards | Stats section in orders view |
| `WorkOrderCard` | Single work order in list | Lines 580-650 |
| `WorkOrderList` | Filtered list of work orders | Main content area |
| `WorkOrderDetail` | Right panel with full details | Lines 700-900 |
| `AssignTechnicianDialog` | Modal to assign technician | Lines 950-1000 |
| `ScheduleJobDialog` | Modal with date/time picker | Lines 1020-1080 |
| `TechnicianScheduleCard` | Tech card with their assigned jobs | Schedule view |
| `RouteMap` | Map placeholder with markers | Map view section |
| `RouteList` | Ordered list of jobs for routing | Map view sidebar |
| `InvoiceCard` | Invoice display in list | Invoices view |
| `InvoiceDetail` | Full invoice with line items | Part of WorkOrderDetail |
| `WebhookLogEntry` | Single log entry row | Webhook view |
| `WebhookStatus` | Connection status indicator | Sidebar bottom |
| `CrewStatus` | List of technicians with status | Sidebar section |
| `PriorityBadge` | Color-coded priority label | Used throughout |
| `StatusBadge` | Work order status badge | Used throughout |
| `NotificationToast` | Toast for real-time updates | Top right notifications |

### Styling Guidelines

Adapt the artifact's industrial/control-room aesthetic to work with shadcn:

1. **Color Palette** - Add to `tailwind.config.js`:
```javascript
colors: {
  copper: {
    DEFAULT: '#d97706',
    dark: '#b45309',
  },
  blueprint: {
    grid: 'rgba(56, 139, 166, 0.03)',
    accent: '#388ba6',
  },
  priority: {
    urgent: '#dc2626',
    high: '#f59e0b',
    medium: '#3b82f6',
    low: '#22c55e',
  }
}
```

2. **Background** - Dark theme with blueprint grid overlay (CSS background-image)

3. **Typography** - Use `IBM Plex Sans` for body, `IBM Plex Mono` for IDs and code

4. **Cards** - Semi-transparent dark backgrounds (`bg-slate-900/80`) with subtle borders

5. **Priority Indicators** - Left border stripe on work order cards matching priority color

---

## Real-time Updates

### Implement Supabase Realtime for live work order updates:

```typescript
// src/hooks/useWorkOrdersRealtime.ts
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useWorkOrdersRealtime(onUpdate: () => void) {
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel('work-orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_orders' },
        (payload) => {
          onUpdate();
          // Optionally show toast for new orders
          if (payload.eventType === 'INSERT') {
            toast({ title: 'New work order received!' });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUpdate]);
}
```

Enable Realtime in Supabase Dashboard:
1. Go to Database → Replication
2. Enable replication for `work_orders` table

---

## State Management

Use a combination of:

1. **Server Components** - For initial data fetching
2. **React Query / SWR** - For client-side data fetching with caching
3. **URL State** - For filters (status, tab) via `nuqs` or `useSearchParams`
4. **React Context** - For selected work order state (shared between list and detail panel)

### Recommended: Create a WorkOrderContext

```typescript
// src/contexts/WorkOrderContext.tsx
interface WorkOrderContextValue {
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  refreshOrders: () => void;
}
```

---

## Data Fetching Patterns

### Server Components (Initial Load)

```typescript
// src/app/(dashboard)/orders/page.tsx
export default async function OrdersPage() {
  const initialOrders = await getWorkOrders();
  const stats = await getDashboardStats();
  
  return <OrdersView initialOrders={initialOrders} initialStats={stats} />;
}
```

### Client Components (Interactive)

```typescript
// src/components/OrdersView.tsx
'use client';

export function OrdersView({ initialOrders, initialStats }) {
  const { data: orders, mutate } = useSWR('/api/work-orders', fetcher, {
    fallbackData: initialOrders,
  });
  
  useWorkOrdersRealtime(() => mutate());
  
  // ... render
}
```

---

## Webhook Security

### Validate incoming webhooks:

```typescript
// src/lib/webhook-auth.ts
export function validateWebhookSecret(request: Request): boolean {
  const secret = request.headers.get('X-Webhook-Secret');
  return secret === process.env.N8N_WEBHOOK_SECRET;
}
```

### Use in API routes:

```typescript
export async function POST(request: Request) {
  if (!validateWebhookSecret(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... process webhook
}
```

---

## Utility Functions

### Create in `src/lib/utils/`:

#### `generateDisplayId.ts`
```typescript
// Generate WO-2024-001 format IDs
export async function generateWorkOrderDisplayId(db): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `WO-${year}-`;
  
  // Get latest order this year
  const latest = await db.query.workOrders.findFirst({
    where: sql`display_id LIKE ${prefix + '%'}`,
    orderBy: desc(workOrders.displayId),
  });
  
  const nextNum = latest 
    ? parseInt(latest.displayId.split('-')[2]) + 1 
    : 1;
  
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}
```

#### `formatters.ts`
```typescript
export function formatTime(date: Date | string): string;
export function formatDate(date: Date | string): string;
export function formatDateTime(date: Date | string): string;
export function formatCurrency(amount: number): string;
```

#### `priorities.ts`
```typescript
export const priorityConfig = {
  urgent: { bg: 'bg-red-900/50', border: 'border-red-500', text: 'text-red-300', label: 'URGENT' },
  high: { bg: 'bg-amber-900/50', border: 'border-amber-500', text: 'text-amber-300', label: 'HIGH' },
  medium: { bg: 'bg-blue-900/50', border: 'border-blue-500', text: 'text-blue-300', label: 'MEDIUM' },
  low: { bg: 'bg-green-900/50', border: 'border-green-500', text: 'text-green-300', label: 'LOW' },
};
```

---

## Testing the Integration

### Manual Test Flow:

1. Start the dev server: `npm run dev`
2. Send a POST to `/api/webhooks/work-orders` with test payload:

```bash
curl -X POST http://localhost:3000/api/webhooks/work-orders \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your_secret" \
  -d '{
    "customer": "Test Customer",
    "address": "123 Test St, Austin, TX 78701",
    "phone": "(512) 555-0000",
    "email": "test@example.com",
    "issue": "Test issue - leaking faucet",
    "priority": "high",
    "status": "new",
    "source": "Email Scrape",
    "estimatedValue": 250
  }'
```

3. Verify work order appears in UI
4. Assign a technician
5. Complete the work order
6. Create and send invoice
7. Check webhook logs view for all activity

---

## Deployment Checklist

- [ ] Set all environment variables in Vercel
- [ ] Run database migrations on Supabase
- [ ] Seed initial technicians
- [ ] Enable Realtime on work_orders table
- [ ] Configure Supabase Auth (if adding login)
- [ ] Update n8n workflow with production webhook URL
- [ ] Test end-to-end flow with n8n

---

## Implementation Order

Recommended sequence for building:

1. **Database Setup**
   - Configure Drizzle with Supabase
   - Create schema and run migrations
   - Seed technicians

2. **API Routes**
   - Webhook receiver (enables n8n testing)
   - Work orders CRUD
   - Stats endpoint

3. **Core UI**
   - Dashboard layout with sidebar
   - Work orders list view
   - Work order detail panel

4. **Interactivity**
   - Assignment dialog
   - Status transitions
   - Real-time updates

5. **Secondary Views**
   - Schedule view
   - Invoices view
   - Webhook logs view

6. **Polish**
   - Map view (placeholder or Mapbox integration)
   - Toast notifications
   - Loading states
   - Error handling

---

## Notes

- The reference artifact uses inline styles; convert these to Tailwind classes
- The artifact is a single-file prototype; split into proper component architecture
- Mock data in artifact shows the expected data shapes; use as reference for TypeScript types
- The artifact's webhook simulation logic should be replaced with real Supabase queries
- Preserve the industrial/blueprint aesthetic while using shadcn's component patterns