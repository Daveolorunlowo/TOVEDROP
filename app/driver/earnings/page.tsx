"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Wallet, Building2, Banknote, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function EarningsPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  const fetchProfile = () => {
    fetch('/api/driver/profile')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch profile')
        return res.json()
      })
      .then(d => {
        if (d.driverProfile) {
          setData(d.driverProfile)
          setBankName(d.driverProfile.bankName || '')
          setAccountNumber(d.driverProfile.accountNumber || '')
          setAccountName(d.driverProfile.accountName || '')
        }
      })
      .catch(err => console.error("Error fetching driver profile:", err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/driver/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankName, accountNumber, accountName })
      })
      if (res.ok) {
        alert('Bank details saved!')
        fetchProfile()
      } else {
        alert('Failed to save bank details')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) return
    setWithdrawing(true)
    try {
      const res = await fetch('/api/driver/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(withdrawAmount) })
      })
      const data = await res.json()
      if (res.ok) {
        alert('Withdrawal request submitted!')
        setShowWithdrawModal(false)
        setWithdrawAmount('')
        fetchProfile()
      } else {
        alert(data.message || 'Withdrawal failed')
      }
    } catch (e) {
      console.error(e)
      alert('Error submitting withdrawal')
    } finally {
      setWithdrawing(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-[#555]">Loading...</div>
  }

  if (!data) return null

  const walletBalance = data.walletBalance || 0

  return (
    <div style={{ background: '#111111', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto px-5 py-8">
        <Link href="/driver" className="inline-flex items-center text-xs font-semibold uppercase tracking-[0.05em] mb-6" style={{ color: '#555' }}>
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold mb-8" style={{ color: '#f5f5f5', letterSpacing: '-0.01em' }}>
          Earnings & Bank
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Earnings Summary */}
          <div className="rounded-lg space-y-6" style={{ background: '#171717', border: '1px solid #222', padding: '24px' }}>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-1" style={{ color: '#555' }}>
                Total Trips Completed
              </p>
              <p className="text-3xl font-bold tabular-nums" style={{ color: '#f5f5f5', letterSpacing: '-0.02em' }}>
                {data.totalTrips}
              </p>
            </div>
            
            <div className="pt-4" style={{ borderTop: '1px solid #1e1e1e' }}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: '#555' }}>
                  Wallet Balance
                </p>
                <Button 
                  size="sm"
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={walletBalance <= 0 || !data.bankName}
                  style={{ background: 'var(--orange-brand)', color: 'black', height: '28px', fontSize: '11px', fontWeight: 'bold' }}
                >
                  Withdraw
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5" style={{ color: '#22c55e' }} />
                <p className="text-3xl font-bold tabular-nums" style={{ color: '#22c55e', letterSpacing: '-0.02em' }}>
                  ₦{walletBalance.toLocaleString()}
                </p>
              </div>
              {!data.bankName && (
                <p className="text-[10px] mt-2 text-red-500">
                  *Please save your bank details before withdrawing.
                </p>
              )}
            </div>
          </div>

          {/* Bank Details */}
          <div className="rounded-lg" style={{ background: '#171717', border: '1px solid #222', padding: '24px' }}>
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-4 h-4" style={{ color: '#888' }} />
              <h2 className="text-sm font-semibold" style={{ color: '#f5f5f5' }}>Bank Details</h2>
            </div>

            <form onSubmit={handleSaveBankDetails} className="space-y-4">
              <div className="space-y-1.5">
                <Label style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase' }}>Bank Name</Label>
                <Input 
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  placeholder="e.g. GTBank, OPay"
                  style={{ background: '#111', border: '1px solid #333', color: '#f5f5f5' }}
                />
              </div>
              
              <div className="space-y-1.5">
                <Label style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase' }}>Account Number</Label>
                <Input 
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  placeholder="0123456789"
                  style={{ background: '#111', border: '1px solid #333', color: '#f5f5f5' }}
                />
              </div>

              <div className="space-y-1.5">
                <Label style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase' }}>Account Name</Label>
                <Input 
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  placeholder="John Doe"
                  style={{ background: '#111', border: '1px solid #333', color: '#f5f5f5' }}
                />
              </div>

              <Button 
                type="submit" 
                disabled={saving}
                className="w-full mt-2"
                style={{ background: 'var(--orange-brand)', color: 'black' }}
              >
                {saving ? 'Saving...' : 'Save Bank Details'}
              </Button>
            </form>
          </div>
        </div>

        {/* Withdrawal History */}
        {data.withdrawalRequests && data.withdrawalRequests.length > 0 && (
          <div className="mt-6 rounded-lg" style={{ background: '#171717', border: '1px solid #222', padding: '24px' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#f5f5f5' }}>Withdrawal History</h2>
            <div className="space-y-3">
              {data.withdrawalRequests.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-md" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                  <div>
                    <p className="text-sm font-bold text-foreground">₦{req.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-[#555]">{new Date(req.createdAt).toLocaleString()}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded" style={{
                    background: req.status === 'APPROVED' ? 'rgba(34,197,94,0.1)' : req.status === 'REJECTED' ? 'rgba(239,68,68,0.1)' : '#1e1e1e',
                    color: req.status === 'APPROVED' ? '#22c55e' : req.status === 'REJECTED' ? '#ef4444' : '#888'
                  }}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg p-6" style={{ background: '#171717', border: '1px solid #333' }}>
            <h2 className="text-lg font-bold text-foreground mb-1">Request Withdrawal</h2>
            <p className="text-xs text-muted-foreground mb-6">Enter the amount you wish to withdraw to {bankName}.</p>
            
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <Label style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase' }}>Amount (₦)</Label>
                <Input 
                  type="number"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder={`Max: ₦${walletBalance}`}
                  max={walletBalance}
                  style={{ background: '#111', border: '1px solid #333', color: '#f5f5f5' }}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowWithdrawModal(false)}
                  style={{ background: 'transparent', borderColor: '#333', color: '#888' }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={withdrawing || !withdrawAmount || Number(withdrawAmount) > walletBalance}
                  className="flex-1"
                  style={{ background: 'var(--orange-brand)', color: 'black' }}
                >
                  {withdrawing ? 'Processing...' : 'Withdraw'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
