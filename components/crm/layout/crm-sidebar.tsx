'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { TechStatusWidget } from '@/components/crm/shared/tech-status-widget';
import {
  ClipboardList,
  Calendar,
  MapPin,
  Receipt,
  Webhook,
  Droplet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Technician } from '@/lib/crm/types';

interface CRMSidebarProps {
  technicians: Technician[];
  newOrdersCount?: number;
  sentInvoicesCount?: number;
}

const navigationItems = [
  {
    title: 'Work Orders',
    href: '/dashboard',
    icon: ClipboardList,
    badgeKey: 'newOrders' as const,
  },
  {
    title: 'Schedule',
    href: '/dashboard/schedule',
    icon: Calendar,
  },
  {
    title: 'Route Map',
    href: '/dashboard/map',
    icon: MapPin,
  },
  {
    title: 'Invoices',
    href: '/dashboard/invoices',
    icon: Receipt,
    badgeKey: 'sentInvoices' as const,
  },
  {
    title: 'Webhook Log',
    href: '/dashboard/webhooks',
    icon: Webhook,
  },
];

export function CRMSidebar({
  technicians,
  newOrdersCount = 0,
  sentInvoicesCount = 0
}: CRMSidebarProps) {
  const pathname = usePathname();

  const badgeValues = {
    newOrders: newOrdersCount,
    sentInvoices: sentInvoicesCount,
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-6">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-primary flex items-center justify-center shadow-lg">
            <Droplet className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary">
              FlowControl
            </h2>
            <p className="text-xs text-muted-foreground">Plumbing CRM</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const badgeCount = item.badgeKey ? badgeValues[item.badgeKey] : 0;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={cn(
                    'group relative',
                    isActive && 'bg-primary/10 text-primary hover:bg-primary/20'
                  )}
                >
                  <Link href={item.href}>
                    <Icon className="w-4 h-4" />
                    <span>{item.title}</span>
                    {badgeCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                      >
                        {badgeCount}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <TechStatusWidget technicians={technicians} />
      </SidebarFooter>
    </Sidebar>
  );
}
