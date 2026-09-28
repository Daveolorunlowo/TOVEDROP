'use client';

import { useEffect, useState } from 'react';

export default function ClearCachePage() {
  const [status, setStatus] = useState('Scrubbing everything clean... 🧹');

  useEffect(() => {
    async function clearEverything() {
      // 1. Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // 2. Clear localStorage & sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      // 3. Unregister all Service Workers (PWA cache)
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
        } catch (err) {
          console.error('SW unregister error', err);
        }
      }

      setStatus('All clean! Redirecting you to login... 🚀');
      
      // 4. Redirect to home/auth with a clean slate
      setTimeout(() => {
        window.location.href = '/auth';
      }, 1500);
    }

    clearEverything();
  }, []);

  return (
    <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 border-4 border-orange-brand border-t-transparent rounded-full animate-spin mb-6"></div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Clearing Bad Data</h1>
      <p className="text-foreground/60">{status}</p>
    </div>
  );
}
