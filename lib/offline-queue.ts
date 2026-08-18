export const addToOfflineQueue = (url: string, method: string, headers: any, body: any) => {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return

  const request = indexedDB.open('tovedrop-db', 1)
  
  request.onupgradeneeded = (event: any) => {
    const db = event.target.result
    if (!db.objectStoreNames.contains('requests')) {
      db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true })
    }
  }
  
  request.onsuccess = (event: any) => {
    const db = event.target.result
    if (!db.objectStoreNames.contains('requests')) return
    
    const tx = db.transaction('requests', 'readwrite')
    tx.objectStore('requests').add({ url, method, headers, body })
    
    tx.oncomplete = async () => {
      // Trigger background sync if possible
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready
          await (registration as any).sync.register('tovedrop-offline-queue')
        } catch (error) {
          console.error('Background Sync registration failed:', error)
        }
      }
    }
  }
}
