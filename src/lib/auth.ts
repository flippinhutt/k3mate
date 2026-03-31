import bcrypt from 'bcryptjs'
import type { SessionOptions } from 'iron-session'

/**
 * Configuration options for the iron-session middleware.
 * Includes password for encryption, cookie name, and security settings.
 */
export const SESSION_OPTIONS: SessionOptions = {
  password: process.env.SESSION_SECRET ?? 'fallback-dev-secret-change-in-prod',
  cookieName: 'k3mate_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24, // 24 hours
  },
}

/**
 * Validates the provided password against the DASHBOARD_PASSWORD environment variable.
 * If DASHBOARD_PASSWORD is not set, the dashboard is open and returns true.
 *
 * @param {string} input The password provided by the user.
 * @returns {Promise<boolean>} True if the password matches or is not required.
 */
export async function checkPassword(input: string): Promise<boolean> {
  const stored = process.env.DASHBOARD_PASSWORD
  if (!stored) return true // open mode
  return bcrypt.compare(input, stored)
}

/**
 * Checks if password authentication is required based on the presence of the DASHBOARD_PASSWORD environment variable.
 *
 * @returns {boolean} True if a dashboard password is configured.
 */
export function isAuthRequired(): boolean {
  return Boolean(process.env.DASHBOARD_PASSWORD)
}
