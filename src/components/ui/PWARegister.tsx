'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    // Temporarily disabling Service Worker to fix production cache issues
    /*
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('SW registered:', reg.scope))
        .catch((err) => console.error('SW registration failed:', err));
    }
    */
    
    // Unregister any existing service workers to clear cache
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    }
  }, []);

  return null;
}
