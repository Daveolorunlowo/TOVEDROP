'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Landmark, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export function WithdrawClient({ 
  walletBalance, 
  bankName, 
  accountNumber, 
  accountName 
}: { 
  walletBalance: number
  bankName: string | null
  accountNumber: string | null
  accountName: string | null
}) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isBankSetup = !!(bankName && accountNumber && accountName)

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const numAmount = parseFloat(amount)
    
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }
    
    if (numAmount > walletBalance) {
      setError('Amount exceeds your wallet balance')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/driver/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount })
      })

      const data = await res.json()
      if (res.ok) {
        // Success
        router.push('/driver?tab=wallet')
        router.refresh()
      } else {
        setError(data.message || 'Failed to submit withdrawal request')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300 pt-4">
      <Link href="/driver?tab=wallet" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2">
        <ArrowLeft className="w-4 h-4" /> Back to Wallet
      </Link>

      <div className="bg-surface-elevated border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-orange-brand/10 flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5 text-orange-brand" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Request Withdrawal</h2>
            <p className="text-sm text-muted-foreground">Available balance: ₦{walletBalance.toLocaleString()}</p>
          </div>
        </div>

        {!isBankSetup ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">Bank Details Missing</p>
              <p className="text-xs opacity-90 mt-1 mb-3">You need to set up your bank details before you can request a withdrawal.</p>
              <Link 
                href="/driver?tab=profile" 
                className="text-xs font-bold bg-red-500 text-white px-3 py-1.5 rounded-lg shadow-sm hover:brightness-110 transition-all inline-block"
              >
                Go to Profile
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleWithdraw} className="space-y-5">
            <div className="bg-surface-card border border-border-subtle rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Receiving Bank Account</p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-foreground">{bankName}</p>
                  <p className="text-xs text-muted-foreground font-medium">{accountNumber}</p>
                  <p className="text-xs text-muted-foreground uppercase">{accountName}</p>
                </div>
                <Link href="/driver?tab=profile" className="text-xs font-bold text-orange-brand hover:underline">Edit</Link>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Amount (₦)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-bold">₦</span>
                <input 
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  max={walletBalance}
                  className="w-full bg-surface-card border border-border rounded-xl pl-8 pr-4 py-3 text-lg font-bold text-foreground focus:outline-none focus:border-orange-brand focus:ring-1 focus:ring-orange-brand transition-all"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > walletBalance}
              className="w-full bg-orange-brand text-primary-foreground font-bold py-3.5 rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.2)] hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                'Submit Request'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
