'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PanicButton({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSOS = async () => {
    setLoading(true)
    
    // Attempt to get location, but don't block if it fails
    let locationData = {}
    if ('geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        })
        locationData = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      } catch (err) {
        console.log("Could not get location for SOS", err)
      }
    }

    try {
      await fetch(`/api/trips/${tripId}/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationData)
      })
      setSent(true)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setTimeout(() => setOpen(false), 3000)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors hover:brightness-110"
        style={{ color: '#fff', background: '#dc2626', border: '1px solid #b91c1c' }}
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        SOS
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-sm rounded-xl overflow-hidden p-6 text-center" style={{ background: 'var(--card)', border: '1px solid #dc2626' }}>
            
            <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            <h2 className="text-xl font-bold mb-2">Emergency SOS</h2>
            
            {!sent ? (
              <>
                <p className="text-sm text-muted-foreground mb-6">
                  Are you in immediate danger? This will alert campus security and TOVEDROP admins with your location.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={loading}>
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleSOS} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm SOS"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-green-500 font-semibold mb-6">
                  SOS Alert Sent. Help has been notified.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
