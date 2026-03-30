import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { checkPassword, SESSION_OPTIONS } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  const ok = await checkPassword(password)

  if (!ok) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  const session = await getIronSession(request, response, SESSION_OPTIONS)
  ;(session as { authenticated?: boolean }).authenticated = true
  await session.save()

  return response
}
