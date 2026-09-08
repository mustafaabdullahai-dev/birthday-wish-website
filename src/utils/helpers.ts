import type { Palette, Emotion } from '../types'

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