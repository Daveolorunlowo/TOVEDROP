import { NextResponse } from "next/server"
import { Pool } from 'pg'

export async function GET() {
  try {
    const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL
    
    if (!connectionString) {
      return NextResponse.json({ 
        success: false, 
        error: "No database URL found in environment variables. Check Vercel Dashboard.",
        envKeys: Object.keys(process.env).filter(k => k.includes('URL') || k.includes('POSTGRES') || k.includes('DATABASE'))
      })
    }

    // Don't log the full string to avoid leaking credentials, just check its shape
    const hasPeriodAtEnd = connectionString.endsWith('.')
    
    // Try to connect directly
    const pool = new Pool({ connectionString })
    const client = await pool.connect()
    
    const res = await client.query('SELECT 1 as connected')
    client.release()
    await pool.end()

    return NextResponse.json({ 
      success: true, 
      message: "Database connection successful!", 
      hasPeriodAtEnd,
      testQuery: res.rows
    })

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
