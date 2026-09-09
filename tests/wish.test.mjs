import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@netlify/blobs', () => ({
  getStore: () => ({
    setJSON: vi.fn(),
    get: vi.fn().mockResolvedValue(null),
    delete: vi.fn(),
  }),
}))

const { checkRate, isValidWish, isExpired } = await import('../netlify/functions/wish.mjs')

describe('wish function helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isValidWish', () => {
    it('accepts a well-formed wish', () => {
      expect(isValidWish({ slug: 'sara-abc', forName: 'Sara', message: 'hi' })).toBe(true)
    })

    it('rejects missing slug', () => {
      expect(isValidWish({ forName: 'Sara' })).toBe(false)
    })

    it('rejects blank forName', () => {
      expect(isValidWish({ slug: 'x', forName: '   ' })).toBe(false)
    })

    it('rejects non-object payloads', () => {
      expect(isValidWish(null)).toBe(false)
      expect(isValidWish('string')).toBe(false)
    })

    it('rejects oversized memories array', () => {
      expect(isValidWish({ slug: 'x', forName: 'Sara', memories: new Array(30) })).toBe(false)
    })

    it('rejects wrong memory type', () => {
      expect(isValidWish({ slug: 'x', forName: 'Sara', memories: 'nope' })).toBe(false)
    })
  })

  describe('isExpired', () => {
    it('returns false when no expiry is set', () => {
      expect(isExpired({ forName: 'Sara' })).toBe(false)
    })

    it('returns true for a past expiry', () => {
      expect(isExpired({ expiresAt: '2020-01-01T00:00:00Z' }, Date.now())).toBe(true)
    })

    it('returns false for a future expiry', () => {
      expect(isExpired({ expiresAt: '2099-01-01T00:00:00Z' }, Date.now())).toBe(false)
    })

    it('is tolerant of an invalid date string', () => {
      expect(isExpired({ expiresAt: 'not-a-date' }, Date.now())).toBe(false)
    })
  })

  describe('checkRate', () => {
    const HOUR = 60 * 60 * 1000

    it('allows up to the limit within the window', () => {
      const map = new Map()
      const t0 = 1_000_000
      for (let i = 1; i <= 5; i += 1) expect(checkRate(map, '1.2.3.4', t0)).toBe(true)
      expect(checkRate(map, '1.2.3.4', t0)).toBe(false)
    })

    it('resets after the window elapses', () => {
      const map = new Map()
      const t0 = 1_000_000
      for (let i = 0; i < 8; i += 1) checkRate(map, 'ip', t0)
      expect(checkRate(map, 'ip', t0 + HOUR + 1)).toBe(true)
    })

    it('tracks IPs independently', () => {
      const map = new Map()
      const t0 = 1_000_000
      for (let i = 0; i < 5; i += 1) checkRate(map, 'a', t0)
      expect(checkRate(map, 'b', t0)).toBe(true)
      expect(checkRate(map, 'a', t0)).toBe(false)
    })
  })
})