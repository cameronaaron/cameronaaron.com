'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      const cleanupKey = 'sw-cleanup-complete';

      if (window.sessionStorage.getItem(cleanupKey) === 'true') {
        return;
      }

      const unregisterServiceWorkers = async () => {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations?.();

          if (registrations?.length) {
            await Promise.all(registrations.map((registration) => registration.unregister()));
          }

          if ('caches' in window) {
            const cacheKeys = await caches.keys();
            await Promise.all(cacheKeys.map((key) => caches.delete(key)));
          }

          window.sessionStorage.setItem(cleanupKey, 'true');

          if (navigator.serviceWorker.controller) {
            window.location.reload();
          }
        } catch (error) {
          console.error('❌ Service worker cleanup failed:', error);
        }
      };

      void unregisterServiceWorkers();
    }
  }, []);

  return null;
}
