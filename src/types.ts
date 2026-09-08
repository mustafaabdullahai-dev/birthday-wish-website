export type Emotion = 'joyful' | 'heartfelt' | 'funny' | 'inspiring' | 'romantic'

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

export interface WishLink {
  id: string
  slug: string
  forName: string
  fromName: string
  emotion: Emotion
  message: string
  cakeColor: string
  theme: string
  memories: MemoryFile[]
  createdAt: string
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