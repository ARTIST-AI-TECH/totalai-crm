import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapMarker } from './map-marker';
import { WorkOrder } from '@/lib/crm/types';
import { calculateMapPosition } from '@/lib/crm/utils';

interface RouteMapProps {
  orders: WorkOrder[];
  onMarkerClick?: (order: WorkOrder) => void;
}

/**
 * Route Map Component
 *
 * Placeholder map visualization with positioned markers.
 * Shows priority legend and calculates marker positions from lat/lng.
 */
export function RouteMap({ orders, onMarkerClick }: RouteMapProps) {
  return (
    <Card className="relative overflow-hidden h-[600px]">
      {/* Blueprint grid background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--color-crm-blueprint)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--color-crm-blueprint)) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Map overlay message */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <Badge variant="secondary" className="text-xs">
          📍 Map Placeholder - Positions based on lat/lng coordinates
        </Badge>
      </div>

      {/* Priority legend */}
      <div className="absolute top-4 right-4 bg-card/95 backdrop-blur p-3 rounded-lg border z-10">
        <h4 className="font-semibold text-xs mb-2">Priority</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600" />
            <span>Urgent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Low</span>
          </div>
        </div>
      </div>

      {/* Map area with markers */}
      <div className="relative w-full h-full">
        {orders.map((order, index) => {
          const position = calculateMapPosition(order.lat, order.lng);
          return (
            <div
              key={order.id}
              style={{
                position: 'absolute',
                left: `${position.x}%`,
                top: `${position.y}%`,
              }}
            >
              <MapMarker
                order={order}
                index={index}
                onClick={() => onMarkerClick?.(order)}
              />
            </div>
          );
        })}
      </div>

      {/* "Connect to Google Maps" overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/80 to-transparent p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Connect to Google Maps API for real map visualization
        </p>
      </div>
    </Card>
  );
}
