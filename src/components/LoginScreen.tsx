import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { audio } from '../utils/audioEngine'
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

function extractSlug(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  const m = t.match(/(?:[#/]|^)celebrate\/([A-Za-z0-9-]+)/i)
  const slug = (m ? m[1] : t).replace(/[#/]*$/, '')
  return /^[A-Za-z0-9-]{1,64}$/.test(slug) ? slug : null
}

export function LoginScreen({ palette }: { palette: Palette }) {
  const setScreen = useStore((s) => s.setScreen)
  const { locale, setLocale } = useI18n()
  const [link, setLink] = useState('')
  const [error, setError] = useState('')
  const openRef = useRef<HTMLInputElement>(null)

  const submitLink = (e: React.FormEvent) => {
    e.preventDefault()
    const slug = extractSlug(link)
    if (!slug) {
      setError('Paste a wish link like #/celebrate/sara-abc123 or just its slug.')
      openRef.current?.focus()
      return
    }
    setError('')
    audio.resume()
    window.location.hash = `/celebrate/${slug}`
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
        className="login-card landing"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="logo-mark">
          <span className="logo-cake">🎂</span>
          <span className="logo-eyebrow">A celebration in your browser</span>
          <h1 className="logo-title">
            Celebrate<span className="dot" style={{ color: palette.primary }}>.</span>
            <span className="dot" style={{ color: palette.accent }}>.</span>
          </h1>
        </div>

        <p className="tagline">Make a moment they'll never forget — craft a wish, share a magic link.</p>

        <button
          type="button"
          className="action-create"
          style={{ ['--glow' as string]: palette.primary }}
          onClick={() => {
            audio.resume()
            setScreen('create')
          }}
        >
          <span className="action-create-icon">🎁</span>
          <span className="action-create-copy">
            <strong>Create a wish link</strong>
            <small>Pick the vibe, add photos & memories, and share a private celebration.</small>
          </span>
          <span className="action-create-arrow">→</span>
        </button>

        <div className="login-actions">
          <p className="login-actions-or">— or —</p>

          <div className="open-card">
            <span className="open-eyebrow">Already have a link?</span>
            <form className="open-row" onSubmit={submitLink}>
              <input
                ref={openRef}
                value={link}
                onChange={(e) => {
                  setLink(e.target.value)
                  setError('')
                }}
                placeholder="Paste the wish link or slug…"
                maxLength={120}
                spellCheck={false}
                autoComplete="off"
                aria-label="Wish link"
              />
              <button type="submit" className="btn-primary" style={{ ['--glow' as string]: palette.primary }}>
                Open
              </button>
            </form>
            {error && <p className="error-text">{error}</p>}
          </div>
        </div>

        <footer className="login-foot">
          <span>💡 Share a wish link so friends can upload memories & wishes.</span>
          <label className="hint-muted">
            No account. No password. Just a magic link.
          </label>
        </footer>
      </motion.main>
    </motion.div>
  )
}