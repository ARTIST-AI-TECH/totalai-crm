'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { triggerWorkOrderProcessing } from '@/app/(dashboard)/actions';

export function ProcessWorkOrdersButton() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [processedCount, setProcessedCount] = useState(0);

  const handleProcess = async () => {
    setIsProcessing(true);
    setStatus('idle');
    setProcessedCount(0);

    try {
      const result = await triggerWorkOrderProcessing();

      if (result.success) {
        setStatus('success');
        setProcessedCount(result.count || 1);
        // Refresh page after 2 seconds to show new work orders
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setStatus('error');
        console.error('Error:', result.error);
      }
    } catch (error) {
      setStatus('error');
      console.error('Error triggering workflow:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleProcess}
        disabled={isProcessing}
        variant={status === 'success' ? 'default' : status === 'error' ? 'destructive' : 'outline'}
        className="gap-2"
      >
        {isProcessing ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle className="h-4 w-4" />
            {processedCount > 1 ? `${processedCount} Work Orders Processed!` : 'Success!'}
          </>
        ) : status === 'error' ? (
          <>
            <XCircle className="h-4 w-4" />
            Error
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Process Work Orders
          </>
        )}
      </Button>

      {status === 'success' && (
        <span className="text-sm text-muted-foreground">
          Refreshing dashboard...
        </span>
      )}
    </div>
  );
}
