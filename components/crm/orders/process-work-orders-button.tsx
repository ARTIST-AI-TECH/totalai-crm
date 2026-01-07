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
    console.log('🔵 UI: Starting work order processing...');
    setIsProcessing(true);
    setStatus('idle');
    setProcessedCount(0);

    try {
      console.log('🔵 UI: Calling server action...');
      const result = await triggerWorkOrderProcessing();
      console.log('🔵 UI: Server action returned:', result);

      if (result.success) {
        console.log(`✅ UI: Success! Processed ${result.count || 1} work orders`);
        setStatus('success');
        setProcessedCount(result.count || 1);
        // No reload needed - Realtime handles updates!
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        console.error('❌ UI: Error:', result.error);
        setStatus('error');
      }
    } catch (error) {
      console.error('❌ UI: Exception:', error);
      setStatus('error');
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
    </div>
  );
}
