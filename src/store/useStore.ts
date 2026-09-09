import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { SessionUser, Screen, WishLink, MemoryFile, CelebrationStage, Emotion, ThemePreset } from '../types'
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
  applyRemoteLink: (link: WishLink) => void
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

      applyRemoteLink: (link) => {
        set({ themedFromLink: link ?? null, linkSeed: link?.slug ?? null })
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
  themePreset?: ThemePreset
  expiresAt?: string
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
    themePreset: input.themePreset,
    expiresAt: input.expiresAt,
    memories: input.memories,
    createdAt: todayISO(),
  }
  links.unshift(link)
  localStorage.setItem('bday_wishLinks', JSON.stringify(links))
  void persistWishRemote(link)
  return link
}

async function persistWishRemote(link: WishLink): Promise<void> {
  try {
    await fetch('/api/wish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(link),
    })
  } catch {
    // offline / local dev without functions — wish still works in this browser
  }
}

export async function fetchWishLink(slug: string): Promise<WishLink | null> {
  try {
    const res = await fetch(`/api/wish?slug=${encodeURIComponent(slug)}`)
    if (!res.ok) return null
    const data = (await res.json()) as WishLink
    return data && typeof data === 'object' && typeof data.forName === 'string' ? data : null
  } catch {
    return null
  }
}

export function getGreetingEra(): string {
  const h = new Date().getHours()
  if (h < 5) return 'night owl'
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}