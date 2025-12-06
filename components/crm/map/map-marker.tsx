import { MapMarkerProps } from '@/lib/crm/types';
import { getPriorityStripeColor } from '@/lib/crm/utils';

/**
 * Map Marker Component
 *
 * SVG pin marker for map visualization.
 * Color-coded by priority with numbered label.
 */
export function MapMarker({ order, index, onClick }: MapMarkerProps) {
  const color = getPriorityStripeColor(order.priority);

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer hover:scale-110 transition-transform"
      onClick={onClick}
    >
      <svg width="32" height="42" viewBox="0 0 32 42" fill="none">
        {/* Pin shape */}
        <path
          d="M16 0C7.716 0 1 6.716 1 15c0 11.25 15 27 15 27s15-15.75 15-27C31 6.716 24.284 0 16 0z"
          fill={color}
          stroke="white"
          strokeWidth="2"
        />
        {/* Number circle */}
        <circle cx="16" cy="15" r="8" fill="white" />
        <text
          x="16"
          y="20"
          textAnchor="middle"
          fontSize="12"
          fontWeight="bold"
          fill={color}
        >
          {index + 1}
        </text>
      </svg>
    </div>
  );
}
