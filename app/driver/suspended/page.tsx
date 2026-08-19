import { XCircle } from 'lucide-react'

export default function SuspendedDriverPage() {
  return (
    <div style={{ background: '#111111', minHeight: '100vh' }} className="flex flex-col items-center justify-center p-6 text-center">
      <XCircle className="w-12 h-12 mb-4 text-red-500" />
      <h2 className="text-xl font-bold mb-2 text-foreground">Account Suspended</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        Your driver account has been suspended. Please contact support for more information or to appeal this decision.
      </p>
    </div>
  )
}
