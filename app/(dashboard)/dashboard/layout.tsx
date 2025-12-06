'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, Suspense } from 'react';
import { LogOut, Home } from 'lucide-react';
import { ThemeSelector } from '@/components/theme-selector';
import { signOut } from '@/app/(login)/actions';
import { User } from '@/lib/db/schema';
import { SuccessNotification } from '@/components/success-notification';
import { CheckoutSuccessHandler } from '@/components/checkout-success-handler';
import useSWR from 'swr';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { CRMSidebar } from '@/components/crm/layout/crm-sidebar';
import { BlueprintBackground } from '@/components/crm/shared/blueprint-background';
import { technicians, initialWorkOrders } from '@/lib/crm/mock-data';
import { getNewOrdersCount, getUnpaidInvoicesCount } from '@/lib/crm/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-9">
          <AvatarImage alt={user.name || ''} />
          <AvatarFallback>
            {user.email
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard" className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getBreadcrumbItems(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const items = [];

  // Map routes to friendly names
  const routeNames: Record<string, string> = {
    'dashboard': 'Work Orders',
    'schedule': 'Schedule',
    'map': 'Route Map',
    'invoices': 'Invoices',
    'webhooks': 'Webhook Log',
  };

  if (pathname === '/dashboard') {
    items.push({ label: 'Work Orders', href: '/dashboard' });
  } else if (segments.length > 1) {
    items.push({ label: 'Work Orders', href: '/dashboard' });
    const page = segments[segments.length - 1];
    const pageLabel = routeNames[page] || page.charAt(0).toUpperCase() + page.slice(1);
    items.push({ label: pageLabel, href: pathname });
  }

  return items;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const breadcrumbItems = getBreadcrumbItems(pathname);

  // Calculate badge counts from mock data
  const newOrdersCount = getNewOrdersCount(initialWorkOrders);
  const sentInvoicesCount = getUnpaidInvoicesCount(initialWorkOrders);

  return (
    <SidebarProvider>
      <BlueprintBackground />
      <Suspense fallback={null}>
        <CheckoutSuccessHandler />
      </Suspense>
      <SuccessNotification />

      <CRMSidebar
        technicians={technicians}
        newOrdersCount={newOrdersCount}
        sentInvoicesCount={sentInvoicesCount}
      />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-sidebar-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2 px-4 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbItems.map((item, index) => (
                  <div key={item.href} className="flex items-center">
                    {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                    <BreadcrumbItem className="hidden md:block">
                      {index === breadcrumbItems.length - 1 ? (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2 px-4">
            <ThemeSelector />
            <Suspense fallback={<div className="h-9" />}>
              <UserMenu />
            </Suspense>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 relative z-10">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
