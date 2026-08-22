"use client"

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/shared/LoadingButton'

import { Suspense } from 'react'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const phone = searchParams.get('phone') || '+233 24 123 4567'
  const intent = searchParams.get('intent')
  
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [timeLeft, setTimeLeft] = useState(45)
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timerId)
    }
  }, [timeLeft])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split('')
      const newCode = [...code]
      for (let i = 0; i < pastedCode.length; i++) {
        if (index + i < 6) {
          newCode[index + i] = pastedCode[i]
        }
      }
      setCode(newCode)
      // Focus the next empty input or the last one
      const nextIndex = Math.min(index + pastedCode.length, 5)
      inputRefs[nextIndex].current?.focus()
      return
    }

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-advance
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const handleResend = () => {
    if (timeLeft === 0) {
      setTimeLeft(45)
      // Call resend API here
    }
  }

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length !== 6) return

    setError(null)
    setIsLoading(true)

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Navigate to next screen
      if (intent === 'book') {
        router.push('/book')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Invalid verification code.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg-deep px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/signup" className="text-white text-2xl font-bold flex items-center" aria-label="Go back">
          {'<'}
        </Link>
        <span className="text-text-secondary text-sm font-medium">2/2</span>
      </div>

      <div className="flex-1 flex flex-col">
        <h1 className="text-3xl font-bold text-white mb-2">Verify Your Number</h1>
        <p className="text-text-secondary text-sm mb-8">
          We sent a code to <span className="text-white font-medium">{phone}</span>
        </p>

        <form onSubmit={handleVerify} className="flex flex-col gap-6">
          <div className="flex justify-between gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 text-center text-xl font-bold text-white bg-card border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors ${
                  error ? 'border-destructive' : 'border-border'
                }`}
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>

          {error && (
            <div className="text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <LoadingButton
            type="submit"
            className="w-full mt-4"
            size="lg"
            isLoading={isLoading}
            disabled={code.join('').length !== 6}
            loadingText="Verifying..."
          >
            Verify Code
          </LoadingButton>
        </form>

        <div className="mt-8 pt-4 pb-6 text-center">
          <p className="text-[13px] text-text-secondary mb-2">Didn't receive the code?</p>
          {timeLeft > 0 ? (
            <p className="text-[13px] text-text-muted font-medium">
              Resend in 0:{timeLeft.toString().padStart(2, '0')}
            </p>
          ) : (
            <button 
              onClick={handleResend}
              className="text-[13px] text-primary font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
            >
              Resend Code
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-deep" />}>
      <VerifyContent />
    </Suspense>
  )
}

