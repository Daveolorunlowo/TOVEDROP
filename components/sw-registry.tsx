'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistry() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-custom.js')
        .then(reg => console.log('Service Worker explicitly registered', reg.scope))
        .catch(err => console.error('Service Worker registration failed', err))
    }
  }, [])
  
  return null
}
