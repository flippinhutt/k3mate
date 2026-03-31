import { parseCpu, parseMemory } from '@/lib/utils'

describe('utils', () => {
  describe('parseCpu', () => {
    it('returns 0 for empty or null', () => {
      expect(parseCpu(null)).toBe(0)
      expect(parseCpu(undefined)).toBe(0)
      expect(parseCpu('')).toBe(0)
    })

    it('parses millicores correctly', () => {
      expect(parseCpu('100m')).toBe(100)
      expect(parseCpu('500m')).toBe(500)
      expect(parseCpu('2500m')).toBe(2500)
    })

    it('parses raw cores into millicores', () => {
      expect(parseCpu('1')).toBe(1000)
      expect(parseCpu('2.5')).toBe(2500)
      expect(parseCpu('0.5')).toBe(500)
    })
  })

  describe('parseMemory', () => {
    it('returns 0 for empty or null', () => {
      expect(parseMemory(null)).toBe(0)
      expect(parseMemory(undefined)).toBe(0)
      expect(parseMemory('')).toBe(0)
    })

    it('parses binary postfixes (Ki, Mi, Gi)', () => {
      expect(parseMemory('1Ki')).toBe(1024)
      expect(parseMemory('500Mi')).toBe(500 * Math.pow(1024, 2))
      expect(parseMemory('2Gi')).toBe(2 * Math.pow(1024, 3))
    })

    it('parses decimal postfixes (K, M, G)', () => {
      expect(parseMemory('1K')).toBe(1000)
      expect(parseMemory('500M')).toBe(500 * Math.pow(1000, 2))
      expect(parseMemory('2G')).toBe(2 * Math.pow(1000, 3))
    })

    it('parses raw byte values', () => {
      expect(parseMemory('1024')).toBe(1024)
      expect(parseMemory('1000000')).toBe(1000000)
    })
  })
})
