'use client';

import { useState } from 'react';
import { RouteMap } from '@/components/crm/map/route-map';
import { RouteList } from '@/components/crm/map/route-list';
import { initialWorkOrders } from '@/lib/crm/mock-data';
import { WorkOrder } from '@/lib/crm/types';

/**
 * Map Page
 *
 * Route planning view with map visualization and route list.
 * Shows work orders with lat/lng coordinates on a placeholder map.
 */
export default function MapPage() {
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

  // Filter orders that have lat/lng coordinates
  const ordersWithLocation = initialWorkOrders.filter(
    (order) => order.lat && order.lng
  );

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Route Map</h1>
        <p className="text-muted-foreground mt-1">
          Plan routes and visualize job locations
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RouteMap
            orders={ordersWithLocation}
            onMarkerClick={setSelectedOrder}
          />
        </div>

        <div className="lg:col-span-1">
          <RouteList
            orders={ordersWithLocation}
            onOrderClick={setSelectedOrder}
          />
        </div>
      </div>

      {selectedOrder && (
        <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
          <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
            Selected: {selectedOrder.id} - {selectedOrder.customer}
          </p>
          <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
            {selectedOrder.address}
          </p>
        </div>
      )}
    </div>
  );
}
