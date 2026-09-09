export type Emotion = 'joyful' | 'heartfelt' | 'funny' | 'inspiring' | 'romantic'

export type ThemePreset = 'classic-gold' | 'pastel-dream' | 'midnight-neon'

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