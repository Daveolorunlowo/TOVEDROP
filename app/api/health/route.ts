import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Force dynamic so Vercel doesn't cache the 200 OK response statically
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const start = performance.now()
    
    // Perform a lightweight query to ensure the DB connection is alive
    await prisma.$queryRaw`SELECT 1`
    
    const dbLatency = performance.now() - start

    return NextResponse.json({ 
      status: 'healthy',
      database: 'connected',
      latency: `${dbLatency.toFixed(2)}ms`,
      timestamp: new Date().toISOString()
    }, { status: 200 })

  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({ 
      status: 'unhealthy',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}
