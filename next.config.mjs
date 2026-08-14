import withPWAInit from 'next-pwa'

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {},
  async redirects() {
    return [
      {
        source: '/track/:path*',
        destination: '/trip/:path*',
        permanent: true,
      },
    ]
  },
}

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  sw: 'sw-custom.js',          // Use our hand-crafted service worker
  disable: false,              // Always register SW so push works in all envs
})

export default withPWA(nextConfig)
