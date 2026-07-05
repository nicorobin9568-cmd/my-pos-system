'use client';

import { useEffect, useState } from 'react';
import { getPendingCount, startSyncEngine, stopSyncEngine } from '@/lib/sync';

export function useSync(tenantId: string | null) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (!tenantId) return;

    startSyncEngine(tenantId);

    const updatePending = async () => {
      const count = await getPendingCount();
      setPendingCount(count);
    };

    const interval = setInterval(updatePending, 5000);
    updatePending();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      stopSyncEngine();
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [tenantId]);

  return { pendingCount, isOnline };
}
