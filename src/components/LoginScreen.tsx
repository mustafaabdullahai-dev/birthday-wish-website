import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useStore, isSessionValid } from '../store/useStore'
import { audio } from '../utils/audioEngine'
import { initials } from '../utils/helpers'
import type { Palette } from '../types'
import { useI18n, LOCALES, type Locale } from '../i18n'

function FloatingBits() {
  const bits = useRef(
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 6,
      duration: 8 + Math.random() * 10,
      size: 2 + Math.random() * 6,
      x: Math.random() * 40 - 20,
    })),
  ).current

  return (
    <div className="bits-layer" aria-hidden>
      {bits.map((b) => (
        <span
          key={b.id}
          className="bit"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
            ['--drift' as string]: `${b.x}px`,
          }}
        />
      ))}
    </div>
  )
}

export function LoginScreen({ palette, onStart }: { palette: Palette; onStart: (name: string) => void }) {
  const session = useStore((s) => s.session)
  const login = useStore((s) => s.login)
  const setScreen = useStore((s) => s.setScreen)
  const { locale, setLocale } = useI18n()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const returning = session && isSessionValid(session)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const submit = (targetName?: string) => {
    const clean = (targetName ?? name).trim()
    if (!clean) {
      setError('Please enter your name to begin')
      return
    }
    audio.resume()
    audio.fanfare()
    login(clean)
    onStart(clean)
  }

  return (
    <motion.div
      className="login-screen"
      style={{ background: `radial-gradient(circle at 30% 20%, ${palette.dark}, #05030f 70%)` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <FloatingBits />

      <div className="lang-switch">
        {LOCALES.map((l) => (
          <button
            key={l}
            className={`lang-btn ${locale === l ? 'active' : ''}`}
            onClick={() => setLocale(l as Locale)}
            aria-label={`Switch language to ${l}`}
          >
            {l === 'en' ? 'EN' : 'اردو'}
          </button>
        ))}
      </div>

      <div className="sparkle" style={{ top: '12%', left: '18%', animationDelay: '0s' }}>✨</div>
      <div className="sparkle" style={{ top: '30%', right: '15%', animationDelay: '1.2s' }}>🎈</div>
      <div className="sparkle" style={{ bottom: '26%', left: '22%', animationDelay: '2.4s' }}>🎂</div>
      <div className="sparkle" style={{ bottom: '18%', right: '24%', animationDelay: '3.1s' }}>🎁</div>

      <motion.main
        className="login-card"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="login-badges">
          {returning && (
            <button className="chip" onClick={() => submit(session.user.username)}>
              Welcome back, {session.user.username}
            </button>
          )}
        </div>

        <div className="logo-mark">
          <span className="logo-cake">🎂</span>
          <span className="logo-eyebrow">A celebration in your browser</span>
          <h1 className="logo-title">
            Celebrate<span className="dot" style={{ color: palette.primary }}>.</span>
            <span className="dot" style={{ color: palette.accent }}>.</span>
          </h1>
        </div>

        <p className="tagline">A magical 3D birthday experience, created just for one special person.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <div className="name-field">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              placeholder="Enter the birthday name..."
              maxLength={24}
              autoComplete="off"
              spellCheck={false}
              aria-label="Birthday name"
            />
            <span className="name-hint">Yes — your name is the password. Typing is magic.</span>
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary" style={{ ['--glow' as string]: palette.primary }}>
            <motion.span whileTap={{ scale: 0.96 }}>Start the Celebration</motion.span>
          </button>
          {name.trim() && (
            <div className="avatar-preview" style={{ borderColor: palette.primary }}>
              <span style={{ background: palette.primary }}>{initials(name)}</span>
              <em>Celebrating <strong>{name.trim()}</strong></em>
            </div>
          )}
        </form>

        <div className="login-actions">
          <button
            className="link-btn"
            onClick={() => {
              audio.resume()
              setScreen('create')
            }}
          >
            🎁 Create a wish link for someone else
          </button>
        </div>

        <footer className="login-foot">
          <span>💡 Tip: Share the link so friends can upload memories & wishes.</span>
          <label className="hint-muted">
            Your name is your password — super easy, zero forgettable.
          </label>
        </footer>
      </motion.main>
    </motion.div>
  )
}