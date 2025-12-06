'use client';

import { useEffect } from 'react';
import { Alert } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { NotificationProps } from '@/lib/crm/types';
import { cn } from '@/lib/utils';

/**
 * Notification Toast Component
 *
 * Displays a floating notification message that auto-dismisses after 3 seconds.
 * Supports success, error, and info types.
 */
export function NotificationToast({ type, message, onDismiss }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icons = {
    success: <CheckCircle2 className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />
  };

  const styles = {
    success: 'bg-green-900/90 text-green-100 border-green-500',
    error: 'bg-red-900/90 text-red-100 border-red-500',
    info: 'bg-blue-900/90 text-blue-100 border-blue-500'
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
      <Alert className={cn('flex items-center gap-3 pr-12', styles[type])}>
        {icons[type]}
        <span className="flex-1 text-sm font-medium">{message}</span>
        <button
          onClick={onDismiss}
          className="absolute right-3 top-3 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </Alert>
    </div>
  );
}
