'use client'

import React, { useState, useEffect } from 'react'
import {
  Wallet,
  Building2,
  Banknote,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  CreditCard,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  walletBalance: number
  driverProfile: any
  onSuccess?: (newBalance: number) => void
}

export function WithdrawModal({
  isOpen,
  onClose,
  walletBalance,
  driverProfile,
  onSuccess
}: WithdrawModalProps) {
  const [amount, setAmount] = useState<string>('')
  const [bankName, setBankName] = useState<string>(driverProfile?.bankName || '')
  const [accountNumber, setAccountNumber] = useState<string>(driverProfile?.accountNumber || '')
  const [accountName, setAccountName] = useState<string>(driverProfile?.accountName || '')
  const [isEditingBank, setIsEditingBank] = useState<boolean>(!driverProfile?.accountNumber)
  const [savingBank, setSavingBank] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  useEffect(() => {
    if (driverProfile) {
      setBankName(driverProfile.bankName || '')
      setAccountNumber(driverProfile.accountNumber || '')
      setAccountName(driverProfile.accountName || '')
      setIsEditingBank(!driverProfile.accountNumber || !driverProfile.bankName)
    }
  }, [driverProfile])

  useEffect(() => {
    if (isOpen) {
      setError(null)
      setSuccess(false)
      setAmount('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const parsedAmount = parseFloat(amount) || 0
  const hasBankDetails = !!(bankName.trim() && accountNumber.trim() && accountName.trim())

  const handleQuickPercent = (pct: number) => {
    const calc = Math.floor((walletBalance * pct) / 100)
    setAmount(String(calc))
  }

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      setError('Please fill out all bank fields.')
      return
    }

    try {
      setSavingBank(true)
      setError(null)

      const res = await fetch('/api/driver/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankName, accountNumber, accountName })
      })

      const d = await res.json()
      if (!res.ok) throw new Error(d.message || 'Failed to save bank details')

      setIsEditingBank(false)
    } catch (err: any) {
      setError(err.message || 'Error saving bank details')
    } finally {
      setSavingBank(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (parsedAmount <= 0) {
      setError('Please enter an amount to withdraw.')
      return
    }
    if (parsedAmount < 100) {
      setError('Minimum withdrawal amount is ₦100.')
      return
    }
    if (parsedAmount > walletBalance) {
      setError('Withdrawal amount cannot exceed your available balance.')
      return
    }
    if (!hasBankDetails) {
      setError('Please enter your destination bank details first.')
      setIsEditingBank(true)
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const res = await fetch('/api/driver/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsedAmount })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Withdrawal request failed')
      }

      setSuccess(true)
      if (onSuccess && typeof data.balance === 'number') {
        onSuccess(data.balance)
      }
    } catch (err: any) {
      setError(err.message || 'Error processing withdrawal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-card border-2 border-border/90 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {success ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-foreground">
                Withdrawal Submitted! 💸
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Your request to withdraw <strong className="text-foreground">₦{parsedAmount.toLocaleString()}</strong> to your bank account ({accountNumber.slice(-4)}) has been submitted for processing.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-elevated border border-border/80 text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Account</span>
                <span className="font-bold text-foreground">{bankName} · {accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Recipient</span>
                <span className="font-bold text-foreground">{accountName}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border/50">
                <span>Remaining Balance</span>
                <span className="font-bold text-emerald-400">₦{(walletBalance - parsedAmount).toLocaleString()}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-[var(--orange-brand)] hover:opacity-90 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Banknote className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                  Driver Earnings Payout
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  Request Withdrawal 💸
                </h2>
              </div>
            </div>

            {/* Current Balance Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-background border-2 border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Available Wallet Balance
                </span>
                <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  ₦{walletBalance.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Eligible for Payout
              </span>
            </div>

            {/* Bank Details View or Edit */}
            {isEditingBank ? (
              <form onSubmit={handleSaveBank} className="p-4 rounded-2xl bg-surface-elevated border border-border/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[var(--orange-brand)]" />
                    Enter Destination Bank
                  </span>
                  {hasBankDetails && (
                    <button
                      type="button"
                      onClick={() => setIsEditingBank(false)}
                      className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. GTBank, OPay, Zenith"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[var(--orange-brand)]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Account Number</label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="10-digit NUBAN"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[var(--orange-brand)] font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Account Name</label>
                    <input
                      type="text"
                      placeholder="Exact name on bank account"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[var(--orange-brand)]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingBank}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingBank ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save Bank Details</span>
                </button>
              </form>
            ) : (
              <div className="p-3.5 rounded-2xl bg-surface-elevated border border-border/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-muted text-muted-foreground">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {bankName} · {accountNumber}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {accountName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingBank(true)}
                  className="text-xs text-[var(--orange-brand)] hover:underline font-bold cursor-pointer"
                >
                  Change
                </button>
              </div>
            )}

            {/* Withdrawal Form */}
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                    Amount to Withdraw (₦)
                  </label>
                  <span className="text-[10px] text-muted-foreground">Min. ₦100</span>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-muted-foreground">
                    ₦
                  </span>
                  <input
                    type="number"
                    min="100"
                    max={walletBalance}
                    placeholder="Enter amount (e.g. 5000)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-background border border-border text-foreground font-black text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                {/* Quick Percentage Chips */}
                <div className="flex items-center gap-2 pt-1">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleQuickPercent(pct)}
                      className="flex-1 py-1 px-2 rounded-lg border border-border hover:border-emerald-500/50 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-surface-card"
                    >
                      {pct === 100 ? 'All' : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl border border-border hover:bg-muted text-foreground text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || parsedAmount <= 0 || parsedAmount > walletBalance || !hasBankDetails}
                  className="flex-2 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-black shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Request (₦{parsedAmount.toLocaleString()})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
