"use client"

import { useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Delay showing banner to not interrupt initial load
      setTimeout(() => {
        const hasDismissed = localStorage.getItem('tovedrop_pwa_dismissed')
        if (!hasDismissed) {
          setShowBanner(true)
        }
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('tovedrop_pwa_dismissed', 'true')
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-surface-card border border-border shadow-lg rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 max-w-lg mx-auto relative">
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary/10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="w-12 h-12 bg-purple-brand/20 rounded-xl flex items-center justify-center shrink-0">
          <Download className="w-6 h-6 text-purple-brand" />
        </div>
        
        <div className="flex-1 text-center sm:text-left pr-4">
          <h3 className="text-sm font-bold text-foreground">Install TOVEDROP App</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Get faster access and push notifications directly on your phone.</p>
        </div>
        
        <Button 
          onClick={handleInstall}
          className="w-full sm:w-auto bg-purple-brand hover:bg-purple-brand/90 text-white font-semibold"
          size="sm"
        >
          Install App
        </Button>
      </div>
    </div>
  )
}
