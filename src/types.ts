export type Emotion = 'joyful' | 'heartfelt' | 'funny' | 'inspiring' | 'romantic'

export type ThemePreset =
  | 'classic-gold'
  | 'pastel-dream'
  | 'midnight-neon'
  | 'rose-blush'
  | 'emerald-veil'
  | 'sunset-amber'
  | 'royal-berry'
  | 'ocean-breeze'
  | 'vintage-lace'
  | 'candy-pop'

export type CardArt =
  | 'confetti'
  | 'balloons'
  | 'stars'
  | 'hearts'
  | 'sparkle'
  | 'rays'
  | 'fireworks'
  | 'waves'
  | 'flowers'
  | 'dots'

export type CakeStyle = 'classic' | 'tiered' | 'square' | 'ring'
export type BalloonStyle = 'classic' | 'pastel' | 'neon' | 'gold' | 'silver'

export const FAMILY_ROLE_IDS = [
  'father',
  'mother',
  'son',
  'daughter',
  'grandfather',
  'grandmother',
  'grandson',
  'granddaughter',
  'uncle',
  'aunt',
  'nephew',
  'niece',
  'brother',
  'sister',
  'husband',
  'wife',
  'cousin',
  'friend',
] as const

export type FamilyRoleId = (typeof FAMILY_ROLE_IDS)[number]

export interface Palette {
  primary: string
  secondary: string
  accent: string
  glow: string
  background: [number, number, number]
  dark: string
}

export interface MemoryFile {
  id: string
  type: 'image' | 'video' | 'text'
  dataUrl?: string
  caption?: string
  message?: string
  from?: string
  uploadedAt: string
}

export interface GuestbookEntry {
  id: string
  name: string
  message: string
  photo?: string
  createdAt: string
}

export interface WishLink {
  id: string
  slug: string
  forName: string
  fromName: string
  emotion: Emotion
  message: string
  cakeColor: string
  theme: string
  themePreset?: ThemePreset
  fromRole?: string
  toRole?: string
  birthday?: string
  birthdayKnown?: boolean
  memories: MemoryFile[]
  createdAt: string
  expiresAt?: string
}

export interface SessionUser {
  userId: string
  username: string
  createdAt: string
  profileColor: string
}

export type CelebrationStage = 'intro' | 'cake' | 'candles' | 'letter' | 'gifts'

export type Screen = 'login' | 'celebration' | 'create'

export interface GalleryFile {
  id: string
  name: string
  type: 'file' | 'dataUrl'
  dataUrl?: string
  caption: string
}