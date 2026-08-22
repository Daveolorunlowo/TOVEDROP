'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Copy, Share2, Clock, MapPin, Navigation } from 'lucide-react'

type TransferTripModalProps = {
  trip: any
  onClose: () => void
}

const REASONS = [
  { value: 'VEHICLE_BREAKDOWN', label: 'Vehicle breakdown' },
  { value: 'FAMILY_EMERGENCY', label: 'Family emergency' },
  { value: 'MEDICAL_EMERGENCY', label: 'Medical emergency' },
  { value: 'FUEL_ISSUE', label: 'Fuel shortage' },
  { value: 'STUCK_IN_TRAFFIC', label: 'Stuck in traffic / unavailable' },
  { value: 'PERSONAL_EMERGENCY', label: 'Personal emergency' },
  { value: 'OTHER', label: 'Other' }
]

export function TransferTripModal({ trip, onClose }: TransferTripModalProps) {
  const router = useRouter()
  const [reason, setReason] = useState<string>('')
  const [reasonNote, setReasonNote] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [transferData, setTransferData] = useState<{ shareToken: string, transferUrl: string, expiresAt: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  // Calculate live countdown timer
  useState(() => {
    if (!transferData) return
    const interval = setInterval(() => {
      const ms = new Date(transferData.expiresAt).getTime() - Date.now()
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
  })

  const handleGenerateLink = async () => {
    if (!reason) return alert('Please select a reason.')
    setIsGenerating(true)
    try {
      const res = await fetch(`/api/trips/${trip.id}/transfer/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, reasonNote })
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to initiate transfer')
        return
      }
      setTransferData(data)
    } catch (error) {
      console.error(error)
      alert('An error occurred.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCancelTransfer = async () => {
    if (!transferData) return
    try {
      await fetch(`/api/trips/transfer/${transferData.shareToken}/cancel`, { method: 'POST' })
      onClose()
      router.refresh()
    } catch (e) {
      console.error(e)
    }
  }

  const handleCopy = () => {
    if (!transferData) return
    navigator.clipboard.writeText(transferData.transferUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsAppShare = () => {
    if (!transferData) return
    const reasonLabel = REASONS.find(r => r.value === reason)?.label
    const text = `Fellow TOVEDROP driver — I need someone to cover my trip. Reason: ${reasonLabel}. Details below. First to accept gets the earnings:\n\n${transferData.transferUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-surface text-foreground border-border">
        {!transferData ? (
          <>
            <DialogHeader>
              <DialogTitle className="uppercase text-sm font-bold tracking-wider text-muted-foreground">Transfer This Trip</DialogTitle>
              <DialogDescription className="sr-only">Transfer trip details</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="p-3 bg-surface-elevated rounded-lg border border-border text-sm flex flex-col gap-2">
                <div className="flex items-center gap-2"><MapPin className="w-3 h-3 text-muted-foreground" /> {trip.pickup}</div>
                <div className="flex items-center gap-2"><Navigation className="w-3 h-3 text-muted-foreground" /> {trip.destination}</div>
                <div className="flex items-center gap-2"><Clock className="w-3 h-3 text-muted-foreground" /> {trip.date} · {trip.time}</div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-500 text-xs flex gap-2 items-start">
                <span className="text-sm mt-0.5">⚠</span>
                <p>Transferring means you will <strong>NOT</strong> receive any earnings for this trip. The driver who accepts will be paid instead.</p>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Reason for transfer (Required)</Label>
                <RadioGroup value={reason} onValueChange={setReason} className="grid grid-cols-1 gap-2">
                  {REASONS.map(r => (
                    <div key={r.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={r.value} id={`reason-${r.value}`} className="border-border text-orange-brand" />
                      <Label htmlFor={`reason-${r.value}`} className="text-sm">{r.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2 mt-4">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Additional note (Optional)</Label>
                <Textarea 
                  placeholder="Explain briefly... e.g. My car has a flat tyre and I cannot get it fixed in time"
                  className="resize-none h-20 text-sm bg-surface-elevated border-border"
                  value={reasonNote}
                  onChange={(e) => setReasonNote(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="sm:justify-end gap-2 mt-2">
              <Button type="button" variant="outline" onClick={onClose} className="border-border hover:bg-surface-elevated">
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleGenerateLink}
                disabled={!reason || isGenerating}
                className="bg-orange-brand hover:brightness-110 text-white font-semibold"
              >
                {isGenerating ? 'Generating...' : 'Generate Transfer Link →'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="uppercase text-sm font-bold tracking-wider text-green-500 flex items-center gap-2">
                <span>✓</span> Transfer link generated!
              </DialogTitle>
              <DialogDescription className="text-sm mt-2 text-muted-foreground">
                Send this link to a fellow TOVEDROP driver. The first driver to accept gets the trip.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="p-3 bg-surface-elevated border border-border rounded flex items-center justify-between">
                <code className="text-xs text-muted-foreground truncate mr-2">{transferData.transferUrl}</code>
              </div>

              <div className="flex gap-2 w-full">
                <Button onClick={handleCopy} variant="outline" className="flex-1 border-border flex items-center gap-2">
                  <Copy className="w-4 h-4" /> {copied ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button onClick={handleWhatsAppShare} className="flex-1 bg-[#25D366] hover:bg-[#20b858] text-white flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Share via WhatsApp
                </Button>
              </div>

              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Expires in</p>
                <p className="text-2xl font-mono text-foreground font-bold tracking-widest">{timeRemaining || '--:--'}</p>
              </div>
            </div>

            <DialogFooter className="sm:justify-center border-t border-border pt-4">
              <Button type="button" variant="ghost" onClick={handleCancelTransfer} className="text-red-500 hover:text-red-400 hover:bg-red-500/10 w-full text-xs uppercase font-bold tracking-wider">
                Cancel Transfer
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
