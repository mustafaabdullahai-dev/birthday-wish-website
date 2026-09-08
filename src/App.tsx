import { useEffect, useMemo, useState, useCallback, lazy, Suspense } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { MemoryFile } from './types'
import { useStore, isSessionValid } from './store/useStore'
import { paletteForName } from './utils/helpers'
import { LoginScreen } from './components/LoginScreen'
import { CreateWish } from './components/CreateWish'

const CelebrateScreen = lazy(() =>
  import('./components/CelebrateScreen').then((m) => ({ default: m.CelebrateScreen })),
)

function parseHash(): string | null {
  const m = window.location.hash.match(/#\/celebrate\/([A-Za-z0-9-]+)/)
  return m ? m[1] : null
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

  const [celebrateName, setCelebrateName] = useState<string | null>(null)
  const [celebrateCtx, setCelebrateCtx] = useState<CelebrateCtx>({})

  const handleHash = useCallback(() => {
    const slug = parseHash()
    if (!slug) return
    const link = applyLink(slug)
    if (link) {
      setCelebrateCtx({
        cakeColor: link.cakeColor,
        message: link.message,
        fromName: link.fromName,
        memories: link.memories,
      })
      setCelebrateName(link.forName)
      setScreen('celebration')
    }
  }, [applyLink, setScreen])

  useEffect(() => {
    const valid = session && isSessionValid(session)
    const slug = parseHash()
    if (slug) {
      handleHash()
    } else if (valid) {
      setCelebrateName(session.user.username)
      setScreen('celebration')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goCelebrate = useCallback(
    (name: string) => {
      setCelebrateCtx({})
      setCelebrateName(name)
      setScreen('celebration')
    },
    [setScreen],
  )

  const displayName = celebrateName ?? (session && isSessionValid(session) ? session.user.username : null)
  const palette = useMemo(() => paletteForName(displayName ?? 'friend'), [displayName])

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
      <Suspense
        fallback={
          <div
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0e0a22',
              color: '#fff',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            🎆 Lighting the fireworks…
          </div>
        }
      >
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
    <AnimatePresence mode="wait">
      {screen === 'create' ? (
        <CreateWish key="create" palette={paletteForName('creator')} />
      ) : (
        <LoginScreen key="login" palette={palette} onStart={(n) => goCelebrate(n)} />
      )}
    </AnimatePresence>
  )
}