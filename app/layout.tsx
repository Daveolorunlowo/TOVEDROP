import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { InstallPrompt } from '@/components/install-prompt'
import { ReferralTracker } from '@/components/referral-tracker'
import { GlobalAuthenticatedNav } from '@/components/shared/GlobalAuthenticatedNav'
import { NetworkIndicator } from '@/components/network-indicator'

import { GlobalMessageListener } from '@/components/global-message-listener'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://tovedrop.com'),
  title: 'TOVEDROP — Your Campus Ride, Your Trusted Driver',
  description:
    'TOVEDROP connects university students to pre-vetted, trustworthy drivers for pre-scheduled trips. Safe, reliable, student-first.',
  generator: 'Next.js',
  applicationName: 'TOVEDROP',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TOVEDROP',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'TOVEDROP — Campus Rideshare',
    description: 'Safe, reliable, student-first rides. Get 3 FREE Drops when you join!',
    url: '/',
    siteName: 'TOVEDROP',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TOVEDROP Cover',
      },
    ],
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TOVEDROP — Campus Rideshare',
    description: 'Safe, reliable, student-first rides. Get 3 FREE Drops when you join!',
    images: ['/og-image.jpg'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
          <GlobalAuthenticatedNav />
          {children}
          <InstallPrompt />
          <ReferralTracker />
          <GlobalMessageListener />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </Providers>
        <NetworkIndicator />
      </body>
    </html>
  )
}
