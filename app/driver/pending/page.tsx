import { Clock } from 'lucide-react'

export default function PendingDriverPage() {
  return (
    <div style={{ background: '#111111', minHeight: '100vh' }} className="flex flex-col items-center justify-center p-6 text-center">
      <Clock className="w-12 h-12 mb-4" style={{ color: 'var(--orange-brand)' }} />
      <h2 className="text-xl font-bold mb-2 text-foreground">Application Under Review</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        We are currently reviewing your driver application. This process usually takes 24-48 hours. We'll email you once you're approved.
      </p>
    </div>
  )
}
