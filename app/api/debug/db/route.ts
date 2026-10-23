import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const rawUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_v5LAkEz6rGcM@ep-summer-moon-ay1fb9vh-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    
    let parsed: any = null
    try {
      const u = new URL(rawUrl)
      parsed = {
        hasEnvVar: !!process.env.DATABASE_URL,
        protocol: u.protocol,
        username: u.username,
        host: u.host,
        database: u.pathname,
        search: u.search,
        passwordLength: u.password?.length || 0,
      }
    } catch (e: any) {
      parsed = { parseError: e.message }
    }

    // Try a simple query
    const userCount = await prisma.user.count()

    return NextResponse.json({
      success: true,
      diagnostics: parsed,
      userCount,
    })
  } catch (error: any) {
    const rawUrl = process.env.DATABASE_URL || ""
    let parsed: any = null
    try {
      const u = new URL(rawUrl)
      parsed = {
        hasEnvVar: !!process.env.DATABASE_URL,
        username: u.username,
        host: u.host,
        search: u.search,
      }
    } catch {}

    return NextResponse.json({ 
      success: false, 
      diagnostics: parsed,
      error: error.message,
      code: error.code,
    }, { status: 500 })
  }
}
