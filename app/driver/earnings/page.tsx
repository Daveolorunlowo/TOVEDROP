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

  useEffect(() => {
    fetch('/api/driver/profile')
      .then(res => res.json())
      .then(d => {
        if (d.driverProfile) {
          setData(d.driverProfile)
          setBankName(d.driverProfile.bankName || '')
          setAccountNumber(d.driverProfile.accountNumber || '')
          setAccountName(d.driverProfile.accountName || '')
        }
        setLoading(false)
      })
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
      } else {
        alert('Failed to save bank details')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-[#111111] flex items-center justify-center text-[#555]">Loading...</div>
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-1" style={{ color: '#555' }}>
                Wallet Balance
              </p>
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5" style={{ color: '#22c55e' }} />
                <p className="text-3xl font-bold tabular-nums" style={{ color: '#22c55e', letterSpacing: '-0.02em' }}>
                  ₦{walletBalance.toLocaleString()}
                </p>
              </div>
              <p className="text-[10px] mt-2" style={{ color: '#444' }}>
                *Withdrawal requests coming soon. Your balance is tracked automatically for every completed ride.
              </p>
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
      </div>
    </div>
  )
}
