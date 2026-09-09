import type { Palette, Emotion, ThemePreset, CardArt, FamilyRoleId, CakeStyle, BalloonStyle } from '../types'

export const PALETTES: Palette[] = [
  {
    primary: '#FFD700',
    secondary: '#FF69B4',
    accent: '#06D6A0',
    glow: '#fff3b0',
    background: [14, 10, 34],
    dark: '#0e0a22',
  },
  {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    accent: '#FFD93D',
    glow: '#ffe5e5',
    background: [22, 10, 26],
    dark: '#160a1a',
  },
  {
    primary: '#7C4DFF',
    secondary: '#00E5FF',
    accent: '#FF9E40',
    glow: '#e0d6ff',
    background: [10, 12, 40],
    dark: '#0a0c28',
  },
  {
    primary: '#69F0AE',
    secondary: '#40C4FF',
    accent: '#FFAB91',
    glow: '#e0ffe9',
    background: [8, 30, 28],
    dark: '#081e1c',
  },
  {
    primary: '#FFC107',
    secondary: '#E91E63',
    accent: '#3F51B5',
    glow: '#fff4cf',
    background: [30, 14, 10],
    dark: '#1e0e0a',
  },
  {
    primary: '#FF5252',
    secondary: '#FFD740',
    accent: '#40C4FF',
    glow: '#ffe3e3',
    background: [26, 8, 12],
    dark: '#1a080c',
  },
]

export function hashName(name: string): number {
  let hash = 0
  const str = name.toLowerCase().trim()
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function paletteForName(name: string): Palette {
  return PALETTES[hashName(name) % PALETTES.length]
}

export const THEME_PRESETS: Record<
  ThemePreset,
  { label: string; tagline: string; palette: Palette; cardArt: CardArt; scene: { cake: CakeStyle; balloons: BalloonStyle; fireworksHue: number } }
> = {
  'classic-gold': {
    label: 'Classic Gold',
    tagline: 'Gilded confetti & warm glow',
    palette: {
      primary: '#FFD700',
      secondary: '#FF69B4',
      accent: '#06D6A0',
      glow: '#fff3b0',
      background: [14, 10, 34],
      dark: '#120d28',
    },
    cardArt: 'confetti',
    scene: { cake: 'classic', balloons: 'gold', fireworksHue: 0.11 },
  },
  'pastel-dream': {
    label: 'Pastel Dream',
    tagline: 'Soft balloons & marshmallow skies',
    palette: {
      primary: '#FFB6C1',
      secondary: '#B19CD9',
      accent: '#77DD77',
      glow: '#ffe9f0',
      background: [30, 22, 40],
      dark: '#2a1f3d',
    },
    cardArt: 'balloons',
    scene: { cake: 'tiered', balloons: 'pastel', fireworksHue: 0.85 },
  },
  'midnight-neon': {
    label: 'Midnight Neon',
    tagline: 'Electric stars on a dark sky',
    palette: {
      primary: '#FF1493',
      secondary: '#00FFFF',
      accent: '#FF9E00',
      glow: '#ffb3e0',
      background: [6, 6, 30],
      dark: '#08081f',
    },
    cardArt: 'stars',
    scene: { cake: 'square', balloons: 'neon', fireworksHue: 0.9 },
  },
  'rose-blush': {
    label: 'Rose Blush',
    tagline: 'Soft hearts & romantic petals',
    palette: {
      primary: '#FF8FAB',
      secondary: '#FF4D6D',
      accent: '#FFD6A5',
      glow: '#ffe0e8',
      background: [30, 14, 22],
      dark: '#260f1a',
    },
    cardArt: 'hearts',
    scene: { cake: 'ring', balloons: 'classic', fireworksHue: 0.95 },
  },
  'emerald-veil': {
    label: 'Emerald Veil',
    tagline: 'Jewel-green shine & golden magic',
    palette: {
      primary: '#3DDC97',
      secondary: '#F4B942',
      accent: '#9EF01A',
      glow: '#d8ffe9',
      background: [4, 24, 20],
      dark: '#071c17',
    },
    cardArt: 'sparkle',
    scene: { cake: 'classic', balloons: 'silver', fireworksHue: 0.4 },
  },
  'sunset-amber': {
    label: 'Sunset Amber',
    tagline: 'Golden rays over glowing embers',
    palette: {
      primary: '#FF9E40',
      secondary: '#E63946',
      accent: '#FFD166',
      glow: '#ffe8c9',
      background: [28, 12, 8],
      dark: '#1f0d07',
    },
    cardArt: 'rays',
    scene: { cake: 'tiered', balloons: 'classic', fireworksHue: 0.06 },
  },
  'royal-berry': {
    label: 'Royal Berry',
    tagline: 'Fireworks over a violet night',
    palette: {
      primary: '#B388FF',
      secondary: '#FF2E97',
      accent: '#40C4FF',
      glow: '#e8d8ff',
      background: [14, 6, 34],
      dark: '#100525',
    },
    cardArt: 'fireworks',
    scene: { cake: 'ring', balloons: 'neon', fireworksHue: 0.78 },
  },
  'ocean-breeze': {
    label: 'Ocean Breeze',
    tagline: 'Cool waves & sky-blue calm',
    palette: {
      primary: '#48CAE4',
      secondary: '#00B4D8',
      accent: '#F1FAEE',
      glow: '#d6f4ff',
      background: [4, 20, 32],
      dark: '#06161f',
    },
    cardArt: 'waves',
    scene: { cake: 'square', balloons: 'silver', fireworksHue: 0.56 },
  },
  'vintage-lace': {
    label: 'Vintage Lace',
    tagline: 'Cream paper & pressed flowers',
    palette: {
      primary: '#E7C68E',
      secondary: '#9B5DE5',
      accent: '#5A3E36',
      glow: '#fbf0db',
      background: [38, 24, 18],
      dark: '#2b1810',
    },
    cardArt: 'flowers',
    scene: { cake: 'tiered', balloons: 'pastel', fireworksHue: 0.76 },
  },
  'candy-pop': {
    label: 'Candy Pop',
    tagline: 'Minty dots & candy-bright cheer',
    palette: {
      primary: '#80FFDB',
      secondary: '#FFD166',
      accent: '#FF5D8F',
      glow: '#e0fff4',
      background: [16, 28, 22],
      dark: '#0e201a',
    },
    cardArt: 'dots',
    scene: { cake: 'ring', balloons: 'neon', fireworksHue: 0.55 },
  },
}

export function applyThemePreset(base: Palette, preset?: ThemePreset): Palette {
  if (!preset) return base
  const p = THEME_PRESETS[preset]?.palette
  return p ? { ...base, ...p } : base
}

export const FAMILY_ROLES: Record<FamilyRoleId, { label: string; emoji: string }> = {
  father: { label: 'Father', emoji: '👨' },
  mother: { label: 'Mother', emoji: '👩' },
  son: { label: 'Son', emoji: '👦' },
  daughter: { label: 'Daughter', emoji: '👧' },
  grandfather: { label: 'Grandfather', emoji: '👴' },
  grandmother: { label: 'Grandmother', emoji: '👵' },
  grandson: { label: 'Grandson', emoji: '🧒' },
  granddaughter: { label: 'Granddaughter', emoji: '🧒' },
  uncle: { label: 'Uncle', emoji: '👨' },
  aunt: { label: 'Aunt', emoji: '👩' },
  nephew: { label: 'Nephew', emoji: '🧒' },
  niece: { label: 'Niece', emoji: '🧒' },
  brother: { label: 'Brother', emoji: '👦' },
  sister: { label: 'Sister', emoji: '👧' },
  husband: { label: 'Husband', emoji: '👨' },
  wife: { label: 'Wife', emoji: '👩' },
  cousin: { label: 'Cousin', emoji: '🧑' },
  friend: { label: 'Friend', emoji: '🧑‍🤝‍🧑' },
}

export const ROLE_PAIR_SUGGESTIONS: [FamilyRoleId, FamilyRoleId][] = [
  ['father', 'daughter'],
  ['father', 'son'],
  ['mother', 'daughter'],
  ['mother', 'son'],
  ['grandfather', 'grandson'],
  ['grandfather', 'granddaughter'],
  ['grandmother', 'grandson'],
  ['grandmother', 'granddaughter'],
  ['uncle', 'nephew'],
  ['uncle', 'niece'],
  ['aunt', 'nephew'],
  ['aunt', 'niece'],
  ['brother', 'sister'],
  ['sister', 'brother'],
  ['brother', 'brother'],
  ['sister', 'sister'],
  ['cousin', 'cousin'],
  ['husband', 'wife'],
  ['wife', 'husband'],
  ['friend', 'friend'],
]

export function roleLabel(id?: string): string {
  if (!id) return ''
  const role = FAMILY_ROLES[id as FamilyRoleId]
  return role ? role.label : id
}

export function relationPhrase(fromRole?: string, toRole?: string): string {
  if (!fromRole) return ''
  const from = roleLabel(fromRole)
  return toRole ? `${from} · ${roleLabel(toRole)}` : from
}

export function versionForName(name: string): number {
  return Math.floor(hashName(name) / 7) % 3
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function makeSlug(name: string): string {
  return `${slugify(name) || 'friend'}-${uid().slice(0, 10)}`
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function todayISO(): string {
  return new Date().toISOString()
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function daysInMonth(month: number, year = 2000): number {
  if (month < 1 || month > 12) return 31
  return new Date(year, month, 0).getDate()
}

export function buildBirthdayISO(month: number | string, day: number | string, year: number | string): string | undefined {
  const m = Number(month)
  const d = Number(day)
  if (!Number.isInteger(m) || !Number.isInteger(d) || m < 1 || m > 12 || d < 1) return undefined
  const max = daysInMonth(m, year ? Number(year) : 2000)
  if (d > max) return undefined
  return `${year ? Number(year) : 2000}-${pad2(m)}-${pad2(d)}`
}

export function formatBirthday(month: number | string, day: number | string, year: number | string, known: boolean): string {
  const m = Number(month)
  const d = Number(day)
  if (!Number.isInteger(m) || !Number.isInteger(d) || m < 1 || m > 12 || d < 1) {
    return known ? '' : 'Date unknown'
  }
  const hasYear = known && Number(year) > 0
  const date = new Date(hasYear ? Number(year) : 2000, m - 1, d)
  const base = date.toLocaleDateString(undefined, hasYear ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'long' })
  return known && !hasYear ? `${base} · year unknown` : base
}

export interface BirthdayParts {
  days: number
  hours: number
  mins: number
  secs: number
  isToday: boolean
}

export function timeUntilBirthday(birthdayISO: string | undefined, now = new Date()): BirthdayParts | null {
  if (!birthdayISO) return null
  const [, m, d] = birthdayISO.split('-').map(Number)
  if (!Number.isInteger(m) || !Number.isInteger(d) || m < 1 || m > 12 || d < 1 || d > 31) return null
  const isToday = now.getMonth() === m - 1 && now.getDate() === d
  if (isToday) return { days: 0, hours: 0, mins: 0, secs: 0, isToday: true }
  let target = new Date(now.getFullYear(), m - 1, d, 0, 0, 0, 0)
  if (target.getTime() < now.getTime() - 10) target = new Date(now.getFullYear() + 1, m - 1, d, 0, 0, 0, 0)
  let ms = target.getTime() - now.getTime()
  if (ms < 0) ms = 0
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms % 86_400_000) / 3_600_000),
    mins: Math.floor((ms % 3_600_000) / 60_000),
    secs: Math.floor((ms % 60_000) / 1_000),
    isToday,
  }
}

export function downscaleImage(file: File, maxDim = 1400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.onload = () => {
      const src = String(reader.result)
      const img = new Image()
      img.onerror = () => reject(new Error('image decode failed'))
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
        const w = Math.max(1, Math.round(img.naturalWidth * scale))
        const h = Math.max(1, Math.round(img.naturalHeight * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(src)
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        resolve(canvas.toDataURL(outType, outType === 'image/png' ? undefined : quality))
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  })
}

export interface Legend {
  title: string
  label: string
  line1: string
  line2: string
  line3: string
  line4: string
  closer: string
}

const WISH_BANK: Record<Emotion, Legend[]> = {
  joyful: [
    {
      title: 'Joyful',
      label: 'To the light of the party',
      line1: 'Today we celebrate you, and honestly the party would be incomplete without your smile.',
      line2: 'You show up, you brighten the room, and you make ordinary days feel like milestones.',
      line3: 'May this year overflow with belly laughs, tiny victories, and magic around every corner.',
      line4: 'Here is to you — the best kind of energy, the warmest kind of person.',
      closer: 'Have the happiest of birthdays, and may the confetti never stop.',
    },
    {
      title: 'Joyful',
      label: 'To the brightest spark',
      line1: 'Your name deserves fireworks today, because you light up every room you enter.',
      line2: 'Being around you feels like sunshine: warm, effortless, and impossible to fake.',
      line3: 'May every candle you blow carry a wish that comes true before the year ends.',
      line4: 'Laugh loudly, dance badly, eat dessert first — that is the birthday law.',
      closer: 'Happy birthday, you wonderful human.',
    },
  ],
  heartfelt: [
    {
      title: 'Heartfelt',
      label: 'With all my love',
      line1: 'Today is all about you, and I want you to know how much you mean to the people around you.',
      line2: 'You have a quiet kindness — the kind that lifts people without them even noticing.',
      line3: 'As you step into this new year, I hope you carry that same kindness for yourself.',
      line4: 'You deserve every good thing that is coming your way, and I believe more is on its way.',
      closer: 'Happy birthday. I am so glad you exist.',
    },
    {
      title: 'Heartfelt',
      label: 'From the heart',
      line1: 'Some people make life softer just by being in it. That is you.',
      line2: 'You do not need a special day to be unforgettable, but it is a good excuse to tell you.',
      line3: 'I hope this year gives you peace when you need it and adventure when you crave it.',
      line4: 'You are more loved than you know, more capable than you believe.',
      closer: 'Wishing you a birthday as wonderful as you are.',
    },
  ],
  funny: [
    {
      title: 'Funny',
      label: 'Zero chill, maximum celebration',
      line1: 'Happy birthday! You have officially been alive for a very suspicious number of years.',
      line2: 'The cake is ready, the candles are lit, and the insurance does not cover our dance moves.',
      line3: 'Try not to blow out the candles too hard — we would rather keep the fire department away.',
      line4: 'You are not getting older, you are getting more expensive to entertain.',
      closer: 'Blow out the candles and make a wish, but please keep it realistic.',
    },
    {
      title: 'Funny',
      label: 'The birthday chaos plan',
      line1: 'Attention: a birthday has been detected, and chaos protocol has officially begun.',
      line2: 'Your job today is simple — eat cake, dodge balloons, and take zero responsibility.',
      line3: 'Any failure to smile will result in a mandatory dance-off (you will lose, we have no rhythm too).',
      line4: 'You may now age guilt-free; your youth officially moved out years ago.',
      closer: 'Happy birthday, chaos coordinator.',
    },
  ],
  inspiring: [
    {
      title: 'Inspiring',
      label: 'To your next chapter',
      line1: 'A new year begins today, and you have more strength and vision than you give yourself credit for.',
      line2: 'Everything you have overcome has quietly built you into someone remarkable.',
      line3: 'I hope this year you chase the dreams you keep putting on pause.',
      line4: 'You have no idea how much you inspire the people around you — including me.',
      closer: 'Go make this your most unforgettable year yet.',
    },
    {
      title: 'Inspiring',
      label: 'Onward and upward',
      line1: 'Today marks the start of your next great chapter, and the pages are blank and yours.',
      line2: 'The courage you have shown so far is proof of what you will do next.',
      line3: 'Dream bigger than last year, because nothing about you is shrinking.',
      line4: 'The world is better with you aiming high and pulling others up with you.',
      closer: 'Happy birthday, future legend.',
    },
  ],
  romantic: [
    {
      title: 'Romantic',
      label: 'To my favorite person',
      line1: 'If I could wrap up everything wonderful about you, the gift would not fit in this world.',
      line2: 'Your eyes, your laugh, the way you make ordinary moments feel like music.',
      line3: 'Another year with you is the only birthday gift I ever need.',
      line4: 'You are my favorite hello and my hardest goodbye, every single day.',
      closer: 'Happy birthday to the one my heart keeps choosing.',
    },
    {
      title: 'Romantic',
      label: 'Forever and a day',
      line1: 'The candles, the cake, the fireworks — none of it compares to just being with you.',
      line2: 'Every year I fall for you again, and every year it feels like the first time.',
      line3: 'May your wishes come true, because you made all of mine come true already.',
      line4: 'I love the way you love this world, and I love being loved by you.',
      closer: 'Happy birthday, my heart knows no other home.',
    },
  ],
}

export function generateWish(name: string, emotion: Emotion): string {
  const pool = WISH_BANK[emotion]
  const pick = pool[hashName(name) % pool.length]
  const clean = name.trim()
  return `Dear ${clean},\n\n${pick.line1}\n${pick.line2}\n${pick.line3}\n${pick.line4}\n\n${pick.closer}`
}

export function surpriseFact(name: string): string {
  const facts = [
    `Psst — your name "${name}" is one in a million; about ${60000 - (hashName(name.toLowerCase()) % 55000)} people on Earth likely share it.`,
    `Fun stat: your name has been wished happy birthday an estimated ${5000 + (hashName(name) % 9000)} times today. Legends only.`,
    `Did you know? The color chosen for your celebration is mathematically the most "you" color possible. Science.`,
    `Your birthday aura is currently off the charts — sources confirm you are the main character today.`,
    `By the numbers: ${1 + (hashName(name) % 99)}% more joy expected this year. Rounding up, that is infinite.`,
  ]
  return facts[hashName(name) % facts.length]
}