import { useEffect, useMemo, useState, useCallback, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { MemoryFile } from './types'
import { useStore, isSessionValid, fetchWishLink } from './store/useStore'
import { paletteForName, applyThemePreset } from './utils/helpers'
import { LoginScreen } from './components/LoginScreen'
import { CreateWish } from './components/CreateWish'
import { LoadingCandle } from './components/LoadingCandle'

const CelebrateScreen = lazy(() =>
  import('./components/CelebrateScreen').then((m) => ({ default: m.CelebrateScreen })),
)

function parseHash(): string | null {
  const m = window.location.hash.match(/#\/celebrate\/([A-Za-z0-9-]+)/)
  return m ? m[1] : null
}

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setProperty(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function markPrivateWish(name: string, fromName?: string, slug?: string) {
  document.title = `Celebrating ${name} — Celebrate`
  setMeta('robots', 'noindex, nofollow')
  setProperty('og:title', `A birthday celebration for ${name}`)
  setProperty('og:description', fromName ? `A wish from ${fromName} — open to celebrate.` : 'A special 3D birthday wish awaits.')
  if (slug) {
    setProperty('og:image', `${window.location.origin}/api/og-image?slug=${encodeURIComponent(slug)}`)
    setProperty('twitter:image', `${window.location.origin}/api/og-image?slug=${encodeURIComponent(slug)}`)
  }
}

function resetMeta() {
  document.title = 'Celebrate — 3D Birthday Wishes'
  setMeta('robots', 'index, follow')
  setProperty('og:title', 'Celebrate — 3D Birthday Wishes')
  setProperty('og:description', 'A magical 3D birthday celebration with fireworks, cake, wishes and memories.')
}

interface CelebrateCtx {
  cakeColor?: string
  message?: string
  fromName?: string
  memories?: MemoryFile[]
}

export default function App() {
  const session = useStore((s) => s.session)
  const screen = useStore((s) => s.screen)
  const setScreen = useStore((s) => s.setScreen)
  const themedFromLink = useStore((s) => s.themedFromLink)
  const applyLink = useStore((s) => s.applyLink)
  const applyRemoteLink = useStore((s) => s.applyRemoteLink)

  const [celebrateName, setCelebrateName] = useState<string | null>(null)
  const [celebrateCtx, setCelebrateCtx] = useState<CelebrateCtx>({})
  const [wishLoading, setWishLoading] = useState(false)
  const [wishMissing, setWishMissing] = useState(false)

  const handleHash = useCallback(async () => {
    const slug = parseHash()
    if (!slug) return
    const local = applyLink(slug)
    if (local) {
      setCelebrateCtx({
        cakeColor: local.cakeColor,
        message: local.message,
        fromName: local.fromName,
        memories: local.memories,
      })
      setCelebrateName(local.forName)
      setScreen('celebration')
      setWishMissing(false)
      markPrivateWish(local.forName, local.fromName, slug)
      return
    }
    setWishLoading(true)
    const remote = await fetchWishLink(slug)
    setWishLoading(false)
    if (remote) {
      applyRemoteLink(remote)
      setCelebrateCtx({
        cakeColor: remote.cakeColor,
        message: remote.message,
        fromName: remote.fromName,
        memories: remote.memories,
      })
      setCelebrateName(remote.forName)
      setScreen('celebration')
      setWishMissing(false)
      markPrivateWish(remote.forName, remote.fromName, slug)
    } else {
      setWishMissing(true)
    }
  }, [applyLink, applyRemoteLink, setScreen])

  useEffect(() => {
    const valid = session && isSessionValid(session)
    const slug = parseHash()
    if (slug) {
      void handleHash()
    } else if (valid) {
      setCelebrateName(session.user.username)
      setScreen('celebration')
    } else {
      resetMeta()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goCelebrate = useCallback(
    (name: string) => {
      setCelebrateCtx({})
      setCelebrateName(name)
      setScreen('celebration')
      setWishMissing(false)
    },
    [setScreen],
  )

  const displayName = celebrateName ?? (session && isSessionValid(session) ? session.user.username : null)
  const basePalette = useMemo(() => paletteForName(displayName ?? 'friend'), [displayName])
  const palette = useMemo(
    () => applyThemePreset(basePalette, themedFromLink?.themePreset),
    [basePalette, themedFromLink?.themePreset],
  )

  const activeCtx: CelebrateCtx = themedFromLink
    ? {
        cakeColor: themedFromLink.cakeColor,
        message: themedFromLink.message,
        fromName: themedFromLink.fromName,
        memories: themedFromLink.memories,
      }
    : celebrateCtx

  if (displayName && screen === 'celebration') {
    return (
      <Suspense fallback={<LoadingCandle palette={palette} />}>
        <CelebrateScreen
          key={displayName}
          name={displayName}
          palette={palette}
          cakeColor={activeCtx.cakeColor}
          cakeMessage={activeCtx.message}
          cakeFrom={activeCtx.fromName}
          cakeMemories={activeCtx.memories}
        />
      </Suspense>
    )
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {screen === 'create' ? (
          <CreateWish key="create" palette={paletteForName('creator')} />
        ) : (
          <LoginScreen key="login" palette={palette} onStart={(n) => goCelebrate(n)} />
        )}
      </AnimatePresence>

      {wishLoading && (
        <div className="wish-overlay">
          <div className="wish-overlay-card">
            <span className="wish-spinner" />
            <p>Fetching your celebration…</p>
          </div>
        </div>
      )}

      {wishMissing && !wishLoading && (
        <motion.div
          className="wish-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ background: `radial-gradient(circle at 50% 30%, ${palette.dark}, #05030f 80%)` }}
        >
          <motion.div
            className="wish-overlay-card"
            initial={{ scale: 0.85, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
          >
            <motion.span
              className="wish-overlay-icon"
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
            >
              🫧
            </motion.span>
            <h3>This wish link could not be found</h3>
            <p>It may have never been shared, or the celebration has since passed. The magic lives on — make your own moment.</p>
            <button
              className="btn-primary"
              style={{ ['--glow' as string]: palette.primary }}
              onClick={() => {
                setWishMissing(false)
                setScreen('create')
              }}
            >
              ✨ Create your own wish instead
            </button>
            <button className="btn-ghost" onClick={() => setWishMissing(false)}>
              Back to home
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}