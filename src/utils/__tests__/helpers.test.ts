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
  FAMILY_ROLES,
  ROLE_PAIR_SUGGESTIONS,
  roleLabel,
  relationPhrase,
  daysInMonth,
  buildBirthdayISO,
  formatBirthday,
  timeUntilBirthday,
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
      const presets = Object.keys(THEME_PRESETS) as Array<keyof typeof THEME_PRESETS>
      expect(presets.length).toBeGreaterThanOrEqual(10)
      for (const preset of presets) {
        const { palette, label, tagline, cardArt } = THEME_PRESETS[preset]
        expect(label).toBeTruthy()
        expect(tagline).toBeTruthy()
        expect(cardArt).toBeTruthy()
        expect(palette.primary).toBeTruthy()
        expect(palette.secondary).toBeTruthy()
        expect(palette.accent).toBeTruthy()
        expect(palette.dark).toBeTruthy()
      }
    })
  })

  describe('family roles', () => {
    it('covers the core family relations with labels', () => {
      expect(FAMILY_ROLES.father.label).toBe('Father')
      expect(FAMILY_ROLES.daughter.label).toBe('Daughter')
      expect(FAMILY_ROLES.uncle.label).toBe('Uncle')
      expect(FAMILY_ROLES.grandfather.label).toBe('Grandfather')
      expect(Object.keys(FAMILY_ROLES).length).toBeGreaterThanOrEqual(15)
    })

    it('exposes curated from->to pair suggestions', () => {
      for (const [from, to] of ROLE_PAIR_SUGGESTIONS) {
        expect(FAMILY_ROLES[from]).toBeTruthy()
        expect(FAMILY_ROLES[to]).toBeTruthy()
      }
    })

    it('roleLabel resolves ids and stays safe for junk', () => {
      expect(roleLabel('father')).toBe('Father')
      expect(roleLabel('')).toBe('')
      expect(roleLabel('???')).toBe('???')
    })

    it('relationPhrase pairs both roles with a separator', () => {
      expect(relationPhrase('father', 'daughter')).toBe('Father · Daughter')
      expect(relationPhrase('uncle', '')).toBe('Uncle')
      expect(relationPhrase('', 'daughter')).toBe('')
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

  describe('birthday helpers', () => {
    it('daysInMonth covers leap Feb and 30-day months', () => {
      expect(daysInMonth(2, 2000)).toBe(29)
      expect(daysInMonth(2, 2001)).toBe(28)
      expect(daysInMonth(4, 2001)).toBe(30)
      expect(daysInMonth(1, 2001)).toBe(31)
    })

    it('buildBirthdayISO zero-pads and refuses invalid days', () => {
      expect(buildBirthdayISO(3, 5, 2005)).toBe('2005-03-05')
      expect(buildBirthdayISO(12, 31, 1990)).toBe('1990-12-31')
      expect(buildBirthdayISO(2, 30, 2001)).toBeUndefined()
      expect(buildBirthdayISO(13, 1, 2000)).toBeUndefined()
    })

    it('buildBirthdayISO uses leak-safe 2000 when year is unknown', () => {
      expect(buildBirthdayISO(2, 29, '')).toBe('2000-02-29')
    })

    it('formatBirthday renders with and without a year', () => {
      expect(formatBirthday(7, 4, 2005, true)).toMatch(/2005/)
      expect(formatBirthday(7, 4, '', true)).toContain('year unknown')
      expect(formatBirthday('', '', '', false)).toContain('unknown')
    })

    it('timeUntilBirthday counts down toward the next occurrence', () => {
      const now = new Date(2026, 4, 15, 0, 0, 0)
      const parts = timeUntilBirthday('2005-05-20', now)
      expect(parts).not.toBeNull()
      expect(parts!.days).toBe(5)
      expect(parts!.hours).toBe(0)
      expect(parts!.isToday).toBe(false)

      const today = timeUntilBirthday('2005-05-15', now)
      expect(today!.isToday).toBe(true)
      expect(today!.days).toBe(0)

      const past = timeUntilBirthday('2005-04-20', now)
      expect(past!.days).toBeGreaterThan(300)
    })
  })
})