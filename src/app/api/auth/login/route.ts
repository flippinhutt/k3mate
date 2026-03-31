import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { checkPassword, SESSION_OPTIONS } from '@/lib/auth'

/**
 * POST handler for user authentication.
 * Validates the provided password and establishes an encrypted session.
 *
 * @param {NextRequest} request The incoming HTTP request containing the password.
 * @returns {Promise<NextResponse>} A JSON response indicating success or failure.
 */
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
