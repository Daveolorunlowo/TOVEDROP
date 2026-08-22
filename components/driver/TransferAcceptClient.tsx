'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Navigation, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

type TransferAcceptClientProps = {
  transfer: any
}

function getReasonText(reason: string, note?: string | null) {
  const map: any = {
    VEHICLE_BREAKDOWN: "Vehicle breakdown",
    FAMILY_EMERGENCY: "Family emergency",
    MEDICAL_EMERGENCY: "Medical emergency",
    FUEL_ISSUE: "Fuel shortage",
    STUCK_IN_TRAFFIC: "Unavoidably delayed",
    PERSONAL_EMERGENCY: "Personal emergency",
    OTHER: note || "Unforeseen circumstances"
  }
  return map[reason] || "Unforeseen circumstances"
}

export function TransferAcceptClient({ transfer }: TransferAcceptClientProps) {
  const router = useRouter()
  const [isAccepting, setIsAccepting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  useEffect(() => {
    const interval = setInterval(() => {
      const ms = new Date(transfer.expiresAt).getTime() - Date.now()
      if (ms <= 0) {
        setTimeRemaining('00:00')
        clearInterval(interval)
      } else {
        const m = Math.floor(ms / 60000).toString().padStart(2, '0')
        const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0')
        setTimeRemaining(`${m}:${s}`)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [transfer.expiresAt])

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      const res = await fetch(`/api/trips/transfer/${transfer.shareToken}/accept`, {
        method: 'POST'
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to accept trip')
        setIsAccepting(false)
        return
      }
      
      router.push('/driver?tab=trips&subtab=upcoming')
      
    } catch (e) {
      console.error(e)
      alert('An error occurred.')
      setIsAccepting(false)
    }
  }

  const earnings = transfer.trip.isPool ? 'Pool ride earnings' : (transfer.trip.bookingFeeNaira ? `₦${Math.round(transfer.trip.bookingFeeNaira * 0.7)}` : 'Standard earnings')

  return (
    <div className="min-h-screen flex items-start justify-center bg-background p-6 pt-12">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
        
        <div className="bg-surface-elevated px-6 py-4 border-b border-border text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Trip Transfer Request</p>
          <h1 className="text-lg font-bold text-foreground">A fellow driver needs coverage</h1>
        </div>

        <div className="p-6 space-y-6">
          <div className="p-4 bg-surface-elevated rounded-lg border border-border space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Pickup</p>
                <p className="text-sm font-semibold truncate">{transfer.trip.pickup}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Navigation className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Destination</p>
                <p className="text-sm font-semibold truncate">{transfer.trip.destination}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-orange-brand mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-orange-brand">Scheduled</p>
                <p className="text-sm font-bold text-orange-brand">{transfer.trip.date} at {transfer.trip.time}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-border mt-2">
              <p className="text-xs text-muted-foreground">Rider: <span className="font-semibold text-foreground">{transfer.trip.rider.name?.split(' ')[0]}</span></p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Reason for transfer</p>
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
              <p className="text-sm text-red-500 italic">"{getReasonText(transfer.reason, transfer.reasonNote)}"</p>
            </div>
          </div>

          <div>
             <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Earnings</p>
             <p className="text-sm font-semibold">You will earn <span className="text-green-500">{earnings}</span> upon completing this trip.</p>
          </div>

          <div className="text-center py-4 border-t border-border">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">⏰ Offer expires in</p>
            <p className="text-3xl font-mono font-bold text-foreground">{timeRemaining || '--:--'}</p>
          </div>

        </div>

        <div className="p-4 bg-surface-elevated border-t border-border flex gap-3">
          <Button variant="outline" className="flex-1 border-border" onClick={() => router.push('/driver')}>
            Decline
          </Button>
          <Button 
            onClick={handleAccept} 
            disabled={isAccepting || timeRemaining === '00:00'}
            className="flex-1 bg-orange-brand hover:brightness-110 text-white font-bold"
          >
            {isAccepting ? 'Accepting...' : 'Accept This Trip →'}
          </Button>
        </div>

      </div>
    </div>
  )
}
