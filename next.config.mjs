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
  disable: process.env.NODE_ENV === 'development',
})

export default withPWA(nextConfig)
