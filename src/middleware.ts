import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { SESSION_OPTIONS } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  // Skip auth for login page and auth API routes
  if (
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next()
  }

  if (!process.env.DASHBOARD_PASSWORD) return NextResponse.next()

  const response = NextResponse.next()
  const session = await getIronSession(request, response, SESSION_OPTIONS)

  if (!(session as { authenticated?: boolean }).authenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
