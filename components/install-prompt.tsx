"use client"

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Share, PlusSquare, ArrowRight, Check } from 'lucide-react'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // 1. Check if already running in standalone mode (already installed)
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')

      setIsStandalone(standalone)
      return standalone
    }

    if (checkStandalone()) return

    // 2. Platform detection
    const ua = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream
    setIsIOS(isIosDevice)

    // 3. Snooze check (3 days snooze on dismiss)
    const isSnoozed = () => {
      try {
        const until = localStorage.getItem('tovedrop_pwa_snoozed_until')
        return until ? Date.now() < Number(until) : false
      } catch (e) {
        return false
      }
    }

    // 4. Android/Chrome prompt listener
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)

      if (!isSnoozed()) {
        setTimeout(() => {
          if (!checkStandalone()) {
            setShowPrompt(true)
          }
        }, 3000)
      }
    }

    // 5. iOS initial check
    if (isIosDevice && !isSnoozed()) {
      setTimeout(() => {
        if (!checkStandalone()) {
          setShowPrompt(true)
        }
      }, 3500)
    }

    // 6. Installed event
    const onInstalled = () => {
      setShowPrompt(false)
      setShowIOSModal(false)
      setDeferredPrompt(null)
      setInstalled(true)
      setTimeout(() => setInstalled(false), 4000)
    }

    // 7. Manual trigger (e.g. from Settings -> Download App)
    const onForceShow = () => {
      try {
        localStorage.removeItem('tovedrop_pwa_snoozed_until')
      } catch (e) {}

      if (isIosDevice) {
        setShowIOSModal(true)
      } else if (deferredPrompt) {
        setShowPrompt(true)
      } else {
        setShowIOSModal(true)
      }
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    window.addEventListener('force-show-pwa-install', onForceShow)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      window.removeEventListener('force-show-pwa-install', onForceShow)
    }
  }, [deferredPrompt])

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSModal(true)
      return
    }

    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    } else {
      setShowIOSModal(true)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setShowIOSModal(false)
    try {
      // Snooze for 4 days
      const snoozedUntil = Date.now() + 4 * 24 * 60 * 60 * 1000
      localStorage.setItem('tovedrop_pwa_snoozed_until', String(snoozedUntil))
    } catch (e) {}
  }

  if (isStandalone && !showPrompt && !showIOSModal) return null

  return (
    <>
      {/* ── Success Feedback Pill ── */}
      <AnimatePresence>
        {installed && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-full bg-card border border-border shadow-xl text-foreground text-xs font-semibold flex items-center gap-2"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span>App added to Home Screen</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Clean, Minimal Floating Install Pill ── */}
      <AnimatePresence>
        {showPrompt && !showIOSModal && (
          <motion.aside
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            aria-label="Install App Prompt"
            className="fixed bottom-4 sm:bottom-6 inset-x-4 sm:inset-x-auto sm:right-6 sm:w-[380px] z-[9999]"
          >
            <div className="bg-card/95 backdrop-blur-md border border-border shadow-xl rounded-2xl p-3 sm:p-3.5 flex items-center gap-3">
              {/* App Monogram / Icon */}
              <div className="w-10 h-10 rounded-xl bg-orange-brand/10 border border-orange-brand/20 flex items-center justify-center text-orange-brand font-black text-xs shrink-0 select-none">
                TD
              </div>

              {/* Title & Description */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">
                  Install TOVEDROP
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  Add to home screen for faster rides
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleInstall}
                  className="px-3 py-1.5 rounded-xl bg-orange-brand hover:opacity-90 active:scale-95 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {isIOS ? 'Add' : 'Install'}
                </button>

                <button
                  onClick={handleDismiss}
                  aria-label="Dismiss"
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Simple, Clean iOS Safari Instructions Modal ── */}
      <AnimatePresence>
        {showIOSModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowIOSModal(false)}
            className="fixed inset-0 z-[100000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card border border-border rounded-2xl p-5 shadow-2xl space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-brand/10 border border-orange-brand/20 flex items-center justify-center text-orange-brand font-black text-xs">
                    TD
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Add to Home Screen</h3>
                    <p className="text-[11px] text-muted-foreground">Quick 2-step setup</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowIOSModal(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 2 Clean Steps */}
              <div className="space-y-2 py-1">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-border/50 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center text-orange-brand shrink-0">
                    <Share className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-foreground">
                    1. Tap the <strong className="text-foreground">Share</strong> icon in Safari
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-border/50 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center text-orange-brand shrink-0">
                    <PlusSquare className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-foreground">
                    2. Select <strong className="text-foreground">Add to Home Screen</strong>
                  </span>
                </div>
              </div>

              {/* Dismiss Button */}
              <button
                onClick={handleDismiss}
                className="w-full py-2.5 rounded-xl bg-orange-brand hover:opacity-90 active:scale-[0.99] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Got It
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
