import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function RejectedDriverPage() {
  return (
    <div style={{ background: '#111111', minHeight: '100vh' }} className="flex flex-col items-center justify-center p-6 text-center">
      <XCircle className="w-12 h-12 mb-4 text-red-500" />
      <h2 className="text-xl font-bold mb-2 text-foreground">Application Not Approved</h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Unfortunately, your application to drive with TOVEDROP was not approved at this time.
      </p>
      <Link href="/apply">
        <Button variant="outline" className="text-foreground border-border-default hover:bg-surface-elevated">
          Reapply
        </Button>
      </Link>
    </div>
  )
}
