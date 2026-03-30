import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { SESSION_OPTIONS } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true })
  const session = await getIronSession(request, response, SESSION_OPTIONS)
  session.destroy()
  return response
}
