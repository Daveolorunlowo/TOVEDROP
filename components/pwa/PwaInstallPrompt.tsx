'use client'

import React, { useState, useEffect } from 'react'
import { Download, X, Share, PlusSquare, Smartphone, Sparkles } from 'lucide-react'

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIos, setIsIos] = useState<boolean>(false)
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false)
  const [isStandalone, setIsStandalone] = useState<boolean>(true)
  const [dismissed, setDismissed] = useState<boolean>(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if already installed / running in standalone mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')

    setIsStandalone(standalone)
    if (standalone) return

    // Check dismiss memory (don't show if dismissed within last 3 days)
    const lastDismissed = localStorage.getItem('tovedrop_pwa_dismissed')
    if (lastDismissed && Date.now() - parseInt(lastDismissed, 10) < 3 * 24 * 60 * 60 * 1000) {
      return
    }

    setDismissed(false)

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const iosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIos(iosDevice)

    // Android / Chrome beforeinstallprompt handler
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setDismissed(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    setShowIosGuide(false)
    localStorage.setItem('tovedrop_pwa_dismissed', String(Date.now()))
  }

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true)
      return
    }

    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDismissed(true)
      }
      setDeferredPrompt(null)
    }
  }

  if (isStandalone || dismissed) return null

  return (
    <aside
      aria-label="Install TOVEDROP App"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-[9990] bg-card/95 border-2 border-[var(--orange-brand)]/40 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[var(--orange-brand)] text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
            T
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--orange-brand)]">
                Campus App
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[var(--orange-brand)]/15 text-[var(--orange-brand)]">
                PWA
              </span>
            </div>
            <h4 className="text-sm font-black text-foreground">
              Install TOVEDROP App 📲
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
        Install for loud background pickup alarms, instant booking, and zero-delay offline caching!
      </p>

      {/* iOS Guide Tooltip */}
      {showIosGuide && (
        <div className="mt-3 p-3 rounded-2xl bg-surface-elevated border border-border text-xs text-foreground space-y-2 animate-in fade-in">
          <p className="font-bold text-[11px] uppercase tracking-wider text-[var(--orange-brand)]">
            How to Install on iPhone / iPad:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px]">
            <li>Tap the <Share className="w-3.5 h-3.5 inline mx-1 text-primary" /> <strong>Share</strong> button at bottom of Safari.</li>
            <li>Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-primary" /> <strong>Add to Home Screen</strong>.</li>
            <li>Tap <strong>Add</strong> in the top right corner!</li>
          </ol>
        </div>
      )}

      <div className="mt-3.5 flex items-center gap-2">
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--orange-brand)] hover:opacity-90 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span>{isIos ? 'How to Install' : 'Install to Home Screen'}</span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="py-2.5 px-3 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          Later
        </button>
      </div>
    </aside>
  )
}
