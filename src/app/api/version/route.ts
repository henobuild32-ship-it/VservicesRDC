import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    version: process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_APP_VERSION || 'local',
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } })
}
