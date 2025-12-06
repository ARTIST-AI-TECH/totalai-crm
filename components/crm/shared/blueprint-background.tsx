'use client';

/**
 * Blueprint Background Component
 *
 * Creates a subtle grid overlay pattern reminiscent of engineering blueprints.
 * Uses CSS background-image for performance and adjusts opacity based on theme.
 */
export function BlueprintBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    >
      <div
        className="w-full h-full opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--color-crm-blueprint)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--color-crm-blueprint)) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
    </div>
  );
}
