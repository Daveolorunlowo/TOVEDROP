import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { InstallPrompt } from '@/components/install-prompt'
import { ReferralTracker } from '@/components/referral-tracker'
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'TOVEDROP — Your Campus Ride, Your Trusted Driver',
  description:
    'TOVEDROP connects university students to pre-vetted, trustworthy drivers for pre-scheduled trips. Safe, reliable, student-first.',
  generator: 'v0.app',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#8B5CF6',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${dmSans.className} antialiased`}>
        <Providers>
          {children}
          <InstallPrompt />
          <ReferralTracker />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </Providers>
      </body>
    </html>
  )
}
