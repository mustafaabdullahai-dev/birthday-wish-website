import { describe, expect, it } from 'vitest'
import {
  hashName,
  paletteForName,
  applyThemePreset,
  versionForName,
  makeSlug,
  slugify,
  initials,
  generateWish,
  surpriseFact,
  THEME_PRESETS,
} from '../helpers'

describe('helpers', () => {
  describe('hashName', () => {
    it('is deterministic and case-insensitive', () => {
      expect(hashName('Sara')).toBe(hashName('sara'))
      expect(hashName(' sara ')).toBe(hashName('sara'))
      expect(typeof hashName('anything')).toBe('number')
    })

    it('returns a non-negative integer (modulo-safe)', () => {
      const h = hashName('SomeVery-Long-Name_With_Symbols!?')
      expect(Number.isInteger(h)).toBe(true)
      expect(h).toBeGreaterThanOrEqual(0)
    })
  })

  describe('paletteForName', () => {
    it('always returns a valid palette from the bank', () => {
      for (const name of ['Ali', 'Sara', '', 'X Æ A-12', 'user 1']) {
        const p = paletteForName(name)
        expect(p.primary).toBeTruthy()
        expect(p.secondary).toBeTruthy()
        expect(p.dark).toBeTruthy()
      }
    })

    it('is stable across calls for the same name', () => {
      expect(paletteForName('Tom')).toEqual(paletteForName('Tom'))
    })
  })

  describe('theme presets', () => {
    it('applyThemePreset returns base untouched when no preset', () => {
      const base = paletteForName('Base')
      expect(applyThemePreset(base)).toBe(base)
    })

    it('applyThemePreset applies the preset palette', () => {
      const base = paletteForName('Base')
      const themed = applyThemePreset(base, 'midnight-neon')
      expect(themed.primary).toBe(THEME_PRESETS['midnight-neon'].palette.primary)
      expect(themed.dark).toBe(THEME_PRESETS['midnight-neon'].palette.dark)
    })

    it('applyThemePreset ignores unknown presets gracefully', () => {
      const base = paletteForName('Base')
      expect(applyThemePreset(base, 'nope' as never)).toBe(base)
    })

    it('all presets carry a full palette', () => {
      for (const preset of Object.keys(THEME_PRESETS) as Array<keyof typeof THEME_PRESETS>) {
        const { palette, label } = THEME_PRESETS[preset]
        expect(label).toBeTruthy()
        expect(palette.primary).toBeTruthy()
        expect(palette.secondary).toBeTruthy()
        expect(palette.accent).toBeTruthy()
        expect(palette.dark).toBeTruthy()
      }
    })
  })

  describe('versionForName', () => {
    it('returns 0, 1, or 2', () => {
      for (const name of ['A', 'B', 'C', 'D']) {
        expect([0, 1, 2]).toContain(versionForName(name))
      }
    })
  })

  describe('slugify / makeSlug', () => {
    it('slugify normalizes names to safe slugs', () => {
      expect(slugify('Sara Khan')).toBe('sara-khan')
      expect(slugify('  Ali  Bin ')).toBe('ali-bin')
      expect(slugify('A!B@C')).toBe('a-b-c')
      expect(slugify('')).toBe('')
    })

    it('makeSlug always returns a non-empty unique slug', () => {
      const s1 = makeSlug('Sara')
      const s2 = makeSlug('Sara')
      expect(s1).toBeTruthy()
      expect(s1).not.toBe(s2)
      expect(s1).toMatch(/^sara-/)
    })
  })

  describe('initials', () => {
    it('extracts up to two initials', () => {
      expect(initials('Sara Khan')).toBe('SK')
      expect(initials('sara')).toBe('S')
      expect(initials(' a ')).toBe('A')
      expect(initials('')).toBe('')
    })
  })

  describe('generateWish / surpriseFact', () => {
    it('generateWish embeds the cleaned name', () => {
      const wish = generateWish('Momo', 'joyful')
      expect(wish).toContain('Dear Momo')
      expect(wish).toContain('\n\n')
    })

    it('generateWish is stable per name+emotion', () => {
      expect(generateWish('Momo', 'funny')).toBe(generateWish('Momo', 'funny'))
    })

    it('surpriseFact mentions the name', () => {
      const fact = surpriseFact('Momo')
      expect(fact).toContain('"Momo"')
    })
  })
})