import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Emotion, MemoryFile, ThemePreset } from '../types'
import { useStore } from '../store/useStore'
import { saveWishLink, readWishLinks } from '../store/useStore'
import { paletteForName, uid, generateWish, todayISO, initials, downscaleImage, THEME_PRESETS } from '../utils/helpers'
import { audio } from '../utils/audioEngine'
import type { Palette } from '../types'
import { QrCode, qrDownloadName } from './QrCode'

const EMOTIONS: { id: Emotion; label: string; icon: string }[] = [
  { id: 'joyful', label: 'Joyful', icon: '🥳' },
  { id: 'heartfelt', label: 'Heartfelt', icon: '💗' },
  { id: 'funny', label: 'Funny', icon: '🤣' },
  { id: 'inspiring', label: 'Inspiring', icon: '🚀' },
  { id: 'romantic', label: 'Romantic', icon: '💖' },
]

const CAKE_COLORS = ['#FF9E9E', '#9ED8FF', '#FFE38F', '#B7E39E', '#D9B0FF', '#FFB6D9', '#8FF0E0']

const EXPIRE_OPTIONS: { id: string; label: string; ms: number | null }[] = [
  { id: '90d', label: 'Keep for 90 days', ms: 90 * 24 * 60 * 60 * 1000 },
  { id: '1y', label: 'Keep for 1 year', ms: 365 * 24 * 60 * 60 * 1000 },
  { id: 'never', label: 'Keep forever', ms: null },
]

const THEME_PRESET_LIST = Object.entries(THEME_PRESETS) as [ThemePreset, { label: string; palette: Palette }][]

const STEPS = ['Who is it for?', 'Pick the vibe', 'Memories', 'Preview & share']

export function CreateWish({ palette }: { palette: Palette }) {
  const setScreen = useStore((s) => s.setScreen)
  const [step, setStep] = useState(0)
  const [forName, setForName] = useState('')
  const [fromName, setFromName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [birthdayKnown, setBirthdayKnown] = useState(true)
  const [emotion, setEmotion] = useState<Emotion>('joyful')
  const [cakeColor, setCakeColor] = useState('#FF9E9E')
  const [themePreset, setThemePreset] = useState<ThemePreset>('classic-gold')
  const [expire, setExpire] = useState('90d')
  const [message, setMessage] = useState('')
  const [memories, setMemories] = useState<MemoryFile[]>([])
  const [link, setLink] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [compact, setCompact] = useState(false)
  const [honeypot, setHoneypot] = useState('')

  const handleUpload = useCallback((files: FileList | null) => {
    if (!files) return
    const imgs = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, 12)
    if (imgs.length === 0) return
    setCompact(true)
    imgs.forEach((f) => {
      downscaleImage(f)
        .then((dataUrl) => {
          setMemories((prev) => {
            if (prev.length >= 20) return prev
            const item: MemoryFile = {
              id: uid(),
              type: 'image',
              dataUrl,
              caption: f.name.replace(/\.[^.]+$/, ''),
              uploadedAt: todayISO(),
            }
            return [...prev, item]
          })
        })
        .catch(() => {
          const reader = new FileReader()
          reader.onload = () => {
            setMemories((prev) => {
              if (prev.length >= 20) return prev
              const item: MemoryFile = {
                id: uid(),
                type: 'image',
                dataUrl: String(reader.result),
                caption: f.name.replace(/\.[^.]+$/, ''),
                uploadedAt: todayISO(),
              }
              return [...prev, item]
            })
          }
          reader.readAsDataURL(f)
        })
    })
  }, [])

  const next = () => {
    if (step === 0 && !forName.trim()) {
      setError("Enter the birthday person's name")
      return
    }
    setError('')
    audio.chime()
    if (step < STEPS.length - 1) setStep(step + 1)
  }

  const back = () => {
    setError('')
    audio.whoosh()
    if (step === 0) setScreen('login')
    else setStep(step - 1)
  }

  const createLink = () => {
    if (honeypot) return
    const cleanFor = forName.trim()
    if (!cleanFor) {
      setError("Enter the birthday person's name")
      return
    }
    const cleanFrom = fromName.trim() || 'A secret admirer'
    const wishText = message.trim() || generateWish(cleanFor, emotion)
    audio.chime()
    const exp = EXPIRE_OPTIONS.find((e) => e.id === expire)
    const expiresAt = exp && exp.ms ? new Date(Date.now() + exp.ms).toISOString() : undefined
    const link = saveWishLink({
      forName: cleanFor,
      fromName: cleanFrom,
      emotion,
      message: wishText,
      cakeColor,
      themePreset,
      expiresAt,
      birthday: birthdayKnown ? birthday : undefined,
      birthdayKnown,
      memories,
    })
    setLink(`${window.location.origin}${window.location.pathname}#/celebrate/${link.slug}`)
  }

  const share = async () => {
    if (!link) return
    if (navigator.share) {
      try {
        await navigator.share({ title: `Birthday wish for ${forName}`, url: link })
        return
      } catch {
        /* user cancelled */
      }
    }
    await navigator.clipboard?.writeText(link).catch(() => undefined)
  }

  const downloadQr = () => {
    const img = document.querySelector<HTMLImageElement>('.qr-img')
    if (!img || !img.src) return
    const a = document.createElement('a')
    a.href = img.src
    a.download = qrDownloadName(forName)
    a.click()
  }

  const previewPalette = THEME_PRESETS[themePreset].palette

  return (
    <motion.div
      className="create-screen"
      style={{ background: `radial-gradient(circle at 20% 10%, ${palette.dark}, #05030f 75%)` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button className="back-btn" onClick={back}>
        ← {step === 0 ? 'Back' : STEPS[step - 1]}
      </button>

      <div className="create-wrap">
        <h2 className="create-title">
          Create a wish for <em style={{ color: palette.primary }}>someone special</em>
        </h2>
        <p className="create-sub">Three little steps — then share a magic link (and a QR code).</p>

        <div className="wizard-steps" aria-label="Progress">
          {STEPS.map((s, i) => (
            <div key={s} className={`wizard-step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
              <span className="wizard-dot">{i < step ? '✓' : i + 1}</span>
              <span className="wizard-label">{s}</span>
            </div>
          ))}
        </div>

        {!link ? (
          <div className="create-card wizard-card">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}
              >
                {step === 0 && (
                  <div className="wizard-pane">
                    <div className="field-row">
                      <label>
                        Birthday person’s name *
                        <input
                          value={forName}
                          onChange={(e) => setForName(e.target.value)}
                          placeholder="e.g. Sony"
                          maxLength={24}
                          autoFocus
                        />
                      </label>
                      <label>
                        Your name
                        <input
                          value={fromName}
                          onChange={(e) => setFromName(e.target.value)}
                          placeholder="How it should appear on the wish"
                          maxLength={24}
                        />
                      </label>
                    </div>
                    <div className="field-block">
                      <span className="field-label">Their birthday</span>
                      <input
                        type="date"
                        value={birthday}
                        disabled={!birthdayKnown}
                        onChange={(e) => setBirthday(e.target.value)}
                        className="date-input"
                      />
                      <label className="toggle-row">
                        <input
                          type="checkbox"
                          checked={!birthdayKnown}
                          onChange={(e) => setBirthdayKnown(!e.target.checked)}
                        />
                        I don’t know the birth year
                      </label>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="wizard-pane">
                    <div className="field-block">
                      <span className="field-label">Choose the emotion of the wish</span>
                      <div className="emotion-row">
                        {EMOTIONS.map((em) => (
                          <button
                            key={em.id}
                            className={`emotion-btn ${emotion === em.id ? 'active' : ''}`}
                            onClick={() => setEmotion(em.id)}
                            style={emotion === em.id ? { borderColor: palette.primary, color: palette.primary } : undefined}
                          >
                            <span>{em.icon}</span> {em.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="field-block">
                      <span className="field-label">Theme preset</span>
                      <div className="theme-row">
                        {THEME_PRESET_LIST.map(([id, t]) => (
                          <button
                            key={id}
                            className={`theme-btn ${themePreset === id ? 'active' : ''}`}
                            onClick={() => setThemePreset(id)}
                            style={themePreset === id ? { borderColor: t.palette.primary } : undefined}
                          >
                            <span className="theme-swatch" style={{ background: `linear-gradient(135deg, ${t.palette.primary}, ${t.palette.secondary})` }} />
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="field-block">
                      <span className="field-label">Cake color</span>
                      <div className="color-row">
                        {CAKE_COLORS.map((c) => (
                          <button
                            key={c}
                            className={`color-dot ${cakeColor === c ? 'active' : ''}`}
                            style={{ background: c }}
                            onClick={() => setCakeColor(c)}
                            aria-label={`cake color ${c}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="field-block">
                      <span className="field-label">Wish link lifespan</span>
                      <div className="expire-row">
                        {EXPIRE_OPTIONS.map((e) => (
                          <button
                            key={e.id}
                            className={`expire-btn ${expire === e.id ? 'active' : ''}`}
                            onClick={() => setExpire(e.id)}
                          >
                            {e.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="wizard-pane">
                    <div className="field-block">
                      <span className="field-label">
                        Your personal message <small>(optional — auto-written if left blank✨)</small>
                      </span>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        maxLength={500}
                        placeholder="Write something heartfelt, funny, or legendary…"
                      />
                    </div>

                    <div className="field-block">
                      <span className="field-label">Attach memories (photos) {memories.length > 0 && <b>({memories.length})</b>}</span>
                      <label className={`dropzone compact ${compact && memories.length > 0 ? 'filled' : ''}`} style={{ ['--glow' as string]: palette.primary }}>
                        <input type="file" accept="image/*" multiple hidden onChange={(e) => handleUpload(e.target.files)} />
                        {memories.length > 0 ? (
                          <span className="dz-filled">📸 {memories.length} memory photos attached — click to add more</span>
                        ) : (
                          <span className="dz-empty">Drop photos here or <em>click to browse</em></span>
                        )}
                      </label>
                      {memories.length > 0 && (
                        <div className="thumb-row">
                          {memories.map((m) => (
                            <span key={m.id} className="thumb">
                              <img src={m.dataUrl} alt={m.caption} />
                              <button
                                onClick={() => setMemories((prev) => prev.filter((x) => x.id !== m.id))}
                                aria-label="remove"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="wizard-pane">
                    <div className="preview-card" style={{ ['--glow' as string]: previewPalette.primary }}>
                      <div className="preview-head" style={{ background: `linear-gradient(135deg, ${previewPalette.primary}, ${previewPalette.secondary})` }}>
                        <h3>🎂 {forName || 'Someone special'}</h3>
                        {birthdayKnown && birthday && <p className="preview-date">🎈 {new Date(birthday).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
                        <p className="preview-from">with love from {fromName || 'a secret admirer'}</p>
                      </div>
                      {memories.length > 0 ? (
                        <div className="preview-photos">
                          {memories.slice(0, 4).map((m) => (
                            <img key={m.id} src={m.dataUrl} alt={m.caption} />
                          ))}
                        </div>
                      ) : (
                        <p className="preview-hint">Add photos on the previous step to make the preview shine ✨</p>
                      )}
                      <p className="preview-message">“{message || generateWish(forName || 'friend', emotion).split('\n\n')[1]?.replace(/\n/g, ' ')?.slice(0, 90)}…”</p>
                      <p className="preview-expiry">{EXPIRE_OPTIONS.find((e) => e.id === expire)?.label}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="honeypot" aria-hidden="true">
              <label>Leave this field empty <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></label>
            </div>

            {error && <p className="error-text">{error}</p>}

            <div className="wizard-nav">
              {step < STEPS.length - 1 ? (
                <button className="btn-primary" style={{ ['--glow' as string]: palette.primary }} onClick={next}>
                  Next →
                </button>
              ) : (
                <button className="btn-primary" style={{ ['--glow' as string]: palette.primary }} onClick={createLink}>
                  ✨ Generate the wish link
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="share-card">
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="link-hero">
              <span className="link-hero-icon">🔗</span>
              <h3>Your wish link is ready!</h3>
              <p>Preview: “A birthday celebration for <strong>{forName}</strong>”</p>
              <div className="link-io">
                <input readOnly value={link} onFocus={(e) => e.target.select()} />
                <button onClick={() => navigator.clipboard?.writeText(link ?? '')}>Copy</button>
              </div>
              <div className="share-badge" style={{ ['--glow' as string]: previewPalette.primary }}>
                <QrCode value={link} />
                <p className="qr-hint">Scan to open the celebration on any phone.</p>
              </div>
              <div className="share-actions">
                <button className="btn-primary" style={{ ['--glow' as string]: palette.primary }} onClick={share}>
                  📤 Share the link
                </button>
                <button className="btn-secondary" onClick={downloadQr}>
                  🖨️ Save QR image
                </button>
                <button className="btn-ghost" onClick={() => setLink(null)}>
                  Make another
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <YourPreviousLinks
          onUse={(slug) => {
            audio.whoosh()
            useStore.getState().applyLink(slug)
            setScreen('celebration')
          }}
        />
      </div>
    </motion.div>
  )
}

function YourPreviousLinks({ onUse }: { onUse: (slug: string) => void }) {
  const links = readWishLinks()
  if (links.length === 0) return null
  return (
    <div className="prev-links">
      <h4>Previously created links</h4>
      {links.slice(0, 4).map((l) => (
        <button key={l.id} className="prev-link" onClick={() => onUse(l.slug)}>
          <span className="prev-avatar" style={{ background: paletteForName(l.forName).primary }}>
            {initials(l.forName)}
          </span>
          <span className="prev-name">
            For <strong>{l.forName}</strong> — by {l.fromName}
          </span>
          <span className="prev-go">open →</span>
        </button>
      ))}
    </div>
  )
}