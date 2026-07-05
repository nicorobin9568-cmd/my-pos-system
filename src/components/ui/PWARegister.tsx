'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    // FORCE CLEAR EVERYTHING: This will run on every page load to ensure no stale cache remains
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister().then(() => {
            console.log('SW unregistered successfully');
          });
        }
      });
    }

    // Also clear Cache Storage if possible
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (let name of names) {
          caches.delete(name);
        }
      });
    }
  }, []);

  return null;
}
