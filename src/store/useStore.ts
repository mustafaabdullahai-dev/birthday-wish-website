import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { SessionUser, Screen, WishLink, MemoryFile, CelebrationStage, Emotion } from '../types'
import { paletteForName, uid, todayISO, makeSlug, hashName } from '../utils/helpers'

const SESSION_TTL = 24 * 60 * 60 * 1000

interface AppState {
  session: { user: SessionUser; expiresAt: number } | null
  screen: Screen
  stage: CelebrationStage
  musicOn: boolean
  volume: number
  linkSeed: string | null
  themedFromLink: WishLink | null

  login: (name: string) => void
  logout: () => void
  setScreen: (s: Screen) => void
  setStage: (s: CelebrationStage) => void
  toggleMusic: () => void
  setVolume: (v: number) => void
  applyLink: (slug: string) => WishLink | null
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      session: null,
      screen: 'login',
      stage: 'intro',
      musicOn: true,
      volume: 0.7,
      linkSeed: null,
      themedFromLink: null,

      login: (name) => {
        const clean = name.trim()
        if (!clean) return
        const color = paletteForName(clean).primary
        set({
          session: { user: { userId: uid(), username: clean, createdAt: todayISO(), profileColor: color }, expiresAt: Date.now() + SESSION_TTL },
        })
      },

      logout: () => set({ session: null, themedFromLink: null }),

      setScreen: (s) => set({ screen: s }),

      setStage: (s) => set({ stage: s }),

      toggleMusic: () => {
        const next = !get().musicOn
        set({ musicOn: next })
      },

      setVolume: (v) => set({ volume: v }),

      applyLink: (slug) => {
        const links: WishLink[] = JSON.parse(localStorage.getItem('bday_wishLinks') ?? '[]')
        const link = links.find((l) => l.slug === slug) ?? null
        set({ themedFromLink: link, linkSeed: slug })
        return link
      },
    }),
    {
      name: 'bday_session',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        session: state.session,
        musicOn: state.musicOn,
        volume: state.volume,
      }),
    },
  ),
)

export function isSessionValid(session: AppState['session']): boolean {
  return session !== null && session.expiresAt > Date.now()
}

export interface MemoryItem {
  id: string
  type: 'image' | 'video' | 'text'
  dataUrl?: string
  caption?: string
  message?: string
  from: string
  uploadedAt: string
}

export function readWishLinks(): WishLink[] {
  try {
    return JSON.parse(localStorage.getItem('bday_wishLinks') ?? '[]') as WishLink[]
  } catch {
    return []
  }
}

export function saveWishLink(input: {
  forName: string
  fromName: string
  emotion: Emotion
  message: string
  cakeColor: string
  memories: MemoryFile[]
}): WishLink {
  const links = readWishLinks()
  const link: WishLink = {
    id: uid(),
    slug: makeSlug(input.forName),
    forName: input.forName,
    fromName: input.fromName,
    emotion: input.emotion,
    message: input.message,
    cakeColor: input.cakeColor,
    theme: String(hashName(input.forName) % 6),
    memories: input.memories,
    createdAt: todayISO(),
  }
  links.unshift(link)
  localStorage.setItem('bday_wishLinks', JSON.stringify(links))
  return link
}

export function getGreetingEra(): string {
  const h = new Date().getHours()
  if (h < 5) return 'night owl'
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}