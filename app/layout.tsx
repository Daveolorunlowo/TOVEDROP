import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { InstallPrompt } from '@/components/install-prompt'
import { ReferralTracker } from '@/components/referral-tracker'
import { GlobalAuthenticatedNav } from '@/components/shared/GlobalAuthenticatedNav'
import { NetworkIndicator } from '@/components/network-indicator'

import { GlobalMessageListener } from '@/components/global-message-listener'
import { ServiceWorkerRegistry } from '@/components/sw-registry'
import { AutoRefreshManager } from '@/components/shared/AutoRefreshManager'
import { WelcomeOverlay } from '@/components/shared/WelcomeOverlay'
import { DynamicBackground } from '@/components/shared/DynamicBackground'
import { CurvedBackground } from '@/components/ui/curved-background'
const inter = Inter({
 subsets: ['latin'],
 weight: ['300', '400', '500', '600', '700'],
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
 description: 'Safe, reliable, student-first rides. ',
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
 description: 'Safe, reliable, student-first rides. ',
 images: ['/og-image.jpg'],
 },
}

export const viewport: Viewport = {
 width: 'device-width',
 initialScale: 1,
 maximumScale: 1,
 userScalable: false,
 colorScheme: 'light',
 themeColor: '#22C55E',
}

import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const hasSeenWelcome = cookieStore.get('tovedrop_welcomed')?.value === 'true'
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {!hasSeenWelcome && (
            <WelcomeOverlay
              hasSeenWelcome={hasSeenWelcome}
              initialFirstName={session?.user?.name?.split(' ')[0] || ''}
              initialRole={(session?.user as any)?.role || 'RIDER'}
            />
          )}
          <DynamicBackground />
          <CurvedBackground curveStyle="asymmetric" topColorClass="bg-orange-brand" bottomColorClass="bg-transparent" animated={true} />
          <GlobalAuthenticatedNav />
          <main className="relative z-10 flex-1 w-full">
            {children}
          </main>
          <InstallPrompt />
          <ReferralTracker />
          <GlobalMessageListener />
          <ServiceWorkerRegistry />
          <AutoRefreshManager />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </Providers>
        <NetworkIndicator />
      </body>
    </html>
  )
}

