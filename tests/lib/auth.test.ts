import { checkPassword, SESSION_OPTIONS } from '@/lib/auth'
import bcrypt from 'bcryptjs'

describe('auth', () => {
  it('returns true when password matches hash', async () => {
    const hash = await bcrypt.hash('secret', 10)
    process.env.DASHBOARD_PASSWORD = hash
    expect(await checkPassword('secret')).toBe(true)
  })

  it('returns false when password does not match', async () => {
    const hash = await bcrypt.hash('secret', 10)
    process.env.DASHBOARD_PASSWORD = hash
    expect(await checkPassword('wrong')).toBe(false)
  })

  it('returns true when no DASHBOARD_PASSWORD is set (open mode)', async () => {
    delete process.env.DASHBOARD_PASSWORD
    expect(await checkPassword('anything')).toBe(true)
  })
})
