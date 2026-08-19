"use client"

import { useState } from 'react'
import { Copy, Share2 } from 'lucide-react'

interface ClientShareButtonsProps {
  referralLink: string
  code: string
}

export function ClientShareButtons({ referralLink, code }: ClientShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const shareText = `Use my code ${code} to get 3 FREE Drops on TOVEDROP!`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join TOVEDROP',
          text: shareText,
          url: referralLink,
        })
      } catch (err) {
        console.error('Failed to share', err)
      }
    } else {
      handleCopy()
    }
  }

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + referralLink)}`
    window.open(url, '_blank')
  }

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralLink)}`
    window.open(url, '_blank')
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mt-4">
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border rounded-lg text-sm font-medium hover:bg-border-default transition-colors"
      >
        <Copy className="w-4 h-4" />
        {copied ? 'Copied!' : 'Copy Link'}
      </button>

      <button
        onClick={handleNativeShare}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--purple-brand)] text-foreground rounded-lg text-sm font-bold hover:bg-purple-600 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>
      
      <button
        onClick={handleWhatsAppShare}
        className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-foreground rounded-lg text-sm font-bold hover:bg-[#20b858] transition-colors"
      >
        WhatsApp
      </button>
      
      <button
        onClick={handleTwitterShare}
        className="flex items-center gap-2 px-4 py-2 bg-[#000000] text-foreground rounded-lg text-sm font-bold hover:bg-[#222222] transition-colors shadow-sm"
      >
        X (Twitter)
      </button>
    </div>
  )
}
