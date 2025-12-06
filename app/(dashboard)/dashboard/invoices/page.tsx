'use client';

import { InvoiceStats } from '@/components/crm/invoices/invoice-stats';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { initialWorkOrders } from '@/lib/crm/mock-data';
import { formatCurrency, formatCurrencyDetailed, calculateInvoiceTotal } from '@/lib/crm/utils';
import { Send, CheckCheck } from 'lucide-react';

/**
 * Invoices Page
 *
 * Displays invoice management with stats and table.
 * Shows all work orders with invoices and their status.
 */
export default function InvoicesPage() {
  // Filter orders that have invoices
  const ordersWithInvoices = initialWorkOrders.filter((order) => order.invoice);

  // Calculate stats
  const draftInvoices = ordersWithInvoices.filter((o) => o.invoice?.status === 'draft');
  const sentInvoices = ordersWithInvoices.filter((o) => o.invoice?.status === 'sent');
  const paidInvoices = ordersWithInvoices.filter((o) => o.invoice?.status === 'paid');

  const sentValue = sentInvoices.reduce(
    (sum, o) => sum + (o.invoice ? calculateInvoiceTotal(o.invoice.items) : 0),
    0
  );
  const paidValue = paidInvoices.reduce(
    (sum, o) => sum + (o.invoice ? calculateInvoiceTotal(o.invoice.items) : 0),
    0
  );

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Invoices</h1>
        <p className="text-muted-foreground mt-1">
          Manage invoices and track payments
        </p>
      </div>

      {/* Stats */}
      <InvoiceStats
        draftCount={draftInvoices.length}
        sentCount={sentInvoices.length}
        sentValue={sentValue}
        paidCount={paidInvoices.length}
        paidValue={paidValue}
      />

      {/* Invoice Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersWithInvoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No invoices found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Work Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersWithInvoices.map((order) => {
                  const invoice = order.invoice!;
                  const total = calculateInvoiceTotal(invoice.items);

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{invoice.id}</TableCell>
                      <TableCell className="font-mono text-sm">{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrencyDetailed(total)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                          className={
                            invoice.status === 'paid'
                              ? 'bg-green-600'
                              : invoice.status === 'sent'
                              ? 'bg-blue-600'
                              : ''
                          }
                        >
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.status === 'draft' && (
                          <Button size="sm" variant="outline">
                            <Send className="h-3 w-3 mr-1" />
                            Send
                          </Button>
                        )}
                        {invoice.status === 'sent' && (
                          <Button size="sm" variant="outline">
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Mark Paid
                          </Button>
                        )}
                        {invoice.status === 'paid' && (
                          <span className="text-xs text-muted-foreground">Paid</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
