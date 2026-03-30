import bcrypt from 'bcryptjs'
import type { SessionOptions } from 'iron-session'

export const SESSION_OPTIONS: SessionOptions = {
  password: process.env.SESSION_SECRET ?? 'fallback-dev-secret-change-in-prod',
  cookieName: 'k3mate_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24, // 24 hours
  },
}

export async function checkPassword(input: string): Promise<boolean> {
  const stored = process.env.DASHBOARD_PASSWORD
  if (!stored) return true // open mode
  return bcrypt.compare(input, stored)
}

export function isAuthRequired(): boolean {
  return Boolean(process.env.DASHBOARD_PASSWORD)
}
