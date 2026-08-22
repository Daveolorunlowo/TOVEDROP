'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'

export function TripCancelButton({ 
  trip, 
  onCancelSuccess 
}: { 
  trip: any, 
  onCancelSuccess: (data: { refunded: boolean, amount: number }) => void 
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<{title: string, desc?: string, type: 'success' | 'warning'} | null>(null)

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  const canCancel = !['COMPLETED', 'CANCELLED'].includes(trip.status)
  
  // Since we map PENDING -> BOOKING_PENDING, CONFIRMED -> DRIVER_ACCEPTED
  const willRefund = trip.status === 'PENDING'
  const driverAccepted = trip.status === 'CONFIRMED'

  async function handleCancelConfirm() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/trips/${trip.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'Rider cancelled from dashboard'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to cancel trip')
      }

      const data = await response.json()
      
      onCancelSuccess({
        refunded: data.drops_refunded,
        amount: data.refund_amount
      })

      setShowConfirm(false)
      
      if (data.drops_refunded) {
        setToastMessage({ type: 'success', title: `✓ Ride cancelled. ${data.refund_amount} Drop(s) refunded.` })
      } else {
        setToastMessage({ 
          type: 'warning', 
          title: '⚠️ Ride cancelled. 1 Drop not refunded.', 
          desc: 'The driver had already accepted your request.' 
        })
      }
    } catch (err: any) {
      setError(err.message)
      setToastMessage({ type: 'warning', title: 'Error cancelling ride', desc: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  if (!canCancel) return null

  return (
    <>
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-[9999] bg-[#111114] border border-[#1a1a1f] text-white px-5 py-4 rounded-xl shadow-2xl flex flex-col gap-1 animate-in slide-in-from-bottom-5 max-w-sm">
          <p className={`text-sm font-bold ${toastMessage.type === 'success' ? 'text-green-500' : 'text-orange-500'}`}>{toastMessage.title}</p>
          {toastMessage.desc && <p className="text-xs text-gray-400">{toastMessage.desc}</p>}
        </div>
      )}

      <button
        onClick={() => setShowConfirm(true)}
        className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-bold bg-orange-brand/10 text-orange-brand hover:bg-orange-brand hover:text-white border border-transparent hover:border-orange-brand/20 transition-all flex items-center justify-center gap-2"
      >
        {driverAccepted && <AlertTriangle className="w-4 h-4" />}
        Cancel Ride
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#111114] border border-[#1a1a1f] rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-white mb-4 text-center">
              Cancel This Ride?
            </h2>

            {willRefund ? (
              // BEFORE ACCEPTANCE
              <div className="mb-6">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <p className="text-sm text-gray-400 text-center leading-relaxed mb-4">
                  Good news! Since no driver has accepted your ride yet, your{' '}
                  <strong className="text-white">1 Drop</strong> will be refunded immediately.
                </p>
                <div className="bg-[#0c0c0e] border border-[#1a1a1f] rounded-xl p-3 text-sm text-gray-400 space-y-1.5">
                  <p className="truncate"><span className="text-gray-500">From:</span> {trip.pickup}</p>
                  <p className="truncate"><span className="text-gray-500">To:</span> {trip.destination}</p>
                  <p className="text-green-500 font-bold mt-2 pt-2 border-t border-[#1a1a1f]">
                    Refund: 1 Drop ✓
                  </p>
                </div>
              </div>
            ) : (
              // AFTER ACCEPTANCE
              <div className="mb-6">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
                <p className="text-sm text-gray-400 text-center leading-relaxed mb-3">
                  Driver has already accepted and is on the way.
                </p>
                <div className="bg-[#1a1410] border-l-4 border-orange-500 rounded-r-xl p-3 mb-4">
                  <p className="text-xs font-semibold text-gray-300 mb-2">If you cancel now:</p>
                  <ul className="text-xs text-gray-400 space-y-1.5">
                    <li className="flex items-center gap-2"><span className="text-orange-500">•</span> Your 1 Drop will <strong className="text-white ml-1">NOT</strong> be refunded</li>
                    <li className="flex items-center gap-2"><span className="text-orange-500">•</span> Driver will be notified of cancellation</li>
                    <li className="flex items-center gap-2"><span className="text-orange-500">•</span> Driver may rate your reliability</li>
                  </ul>
                </div>
                <div className="bg-[#0c0c0e] border border-[#1a1a1f] rounded-xl p-3 text-sm text-gray-400 space-y-1.5">
                  <p className="truncate"><span className="text-gray-500">From:</span> {trip.pickup}</p>
                  <p className="truncate"><span className="text-gray-500">To:</span> {trip.destination}</p>
                  <p className="text-red-500 font-bold mt-2 pt-2 border-t border-[#1a1a1f]">
                    Loss: 1 Drop ✗
                  </p>
                </div>
                <p className="text-xs text-center text-gray-500 mt-3 font-medium">Still want to cancel?</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center p-2 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCancelConfirm}
                disabled={isLoading}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center transition-all ${
                  willRefund 
                    ? 'bg-green-500 hover:bg-green-600 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                }`}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Cancellation'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isLoading}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-surface-elevated border border-border-subtle text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
              >
                Keep Ride
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
