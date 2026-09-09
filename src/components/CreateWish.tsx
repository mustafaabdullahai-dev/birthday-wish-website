import { useState, useCallback } from 'react'
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

const STEPS = [
  { label: 'Who', chapter: 'About' },
  { label: 'Vibe', chapter: 'Vibe' },
  { label: 'Memories', chapter: 'Memories' },
  { label: 'Preview', chapter: 'Preview' },
]

const STEP_COPY = [
  {
    title: (<>Who is this <Em>for</Em></>),
    subtitle: "Let's start with their name — and create a wish link for someone special.",
  },
  {
    title: (<>Set the <Em>vibe</Em></>),
    subtitle: 'Pick an emotion, a cake color, and how long the magic link should last.',
  },
  {
    title: (<>Add your <Em>memories</Em></>),
    subtitle: 'A personal message and a few photos make it unforgettable.',
  },
  {
    title: (<>Looks <Em>ready?</Em></>),
    subtitle: 'The preview updates live on the right — then generate a private link and a QR code.',
  },
]

function Em({ children }: { children: React.ReactNode }) {
  return (
    <span className="cv2-title-emphasis cv2-underlined-word">
      <span className="cv2-underlined-word-text">{children}</span>
      <span className="cv2-underlined-word-mark" aria-hidden>
        <svg viewBox="0 0 200 30" preserveAspectRatio="none">
          <path d="M6 22C30 8 52 14 74 10C104 5 128 18 156 9C172 4 188 8 196 6" />
        </svg>
      </span>
    </span>
  )
}

function Circle({ d }: { d: string }) {
  return (
    <svg className="cnk" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  )
}

export function CreateWish() {
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
  const [honeypot, setHoneypot] = useState('')
  const [themeMenu, setThemeMenu] = useState(false)

  const handleUpload = useCallback((files: FileList | null) => {
    if (!files) return
    const imgs = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, 12)
    if (imgs.length === 0) return
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
    if (link) {
      setLink(null)
      return
    }
    if (step === 0) setScreen('login')
    else setStep(step - 1)
  }

  const goPreview = () => {
    audio.chime()
    if (step < 3) setStep(3)
  }

  const createLink = () => {
    if (honeypot) return
    const cleanFor = forName.trim()
    if (!cleanFor) {
      setError("Enter the birthday person's name")
      setStep(0)
      return
    }
    const cleanFrom = fromName.trim() || 'A secret admirer'
    const wishText = message.trim() || generateWish(cleanFor, emotion)
    audio.chime()
    const exp = EXPIRE_OPTIONS.find((e) => e.id === expire)
    const expiresAt = exp && exp.ms ? new Date(Date.now() + exp.ms).toISOString() : undefined
    const saved = saveWishLink({
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
    setLink(`${window.location.origin}${window.location.pathname}#/celebrate/${saved.slug}`)
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
  const chapter = STEPS[step].chapter
  const copy = STEP_COPY[step]
  const emoji = EMOTIONS.find((e) => e.id === emotion)
  const expiryLabel = EXPIRE_OPTIONS.find((e) => e.id === expire)?.label ?? ''

  return (
    <div className="create-screen">
      <div className="cv2-shell" data-active-chapter={chapter.toLowerCase()}>
        <header className="cv2-shell-header">
          <div className="cv2-shell-progress">
            <span className="cv2-progress-label">{chapter}</span>
            <ol className="cv2-progress-bars">
              {STEPS.map((s, i) => (
                <li key={s.label}>
                  <button
                    type="button"
                    className={i === step ? 'active' : i < step ? 'complete' : ''}
                    onClick={() => i < step && setStep(i)}
                    aria-label={`Go to ${s.chapter} step`}
                    tabIndex={i < step ? 0 : -1}
                  >
                    <span />
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </header>

        <div className="cv2-shell-split">
          <section className="cv2-shell-main">
            <div className="cv2-shell-form">
              <div className="cv2-chapter-header">
                <span className="cv2-chapter-accent cv2-chapter-accent-0" />
                <h1 className="cv2-title cv2-chapter-title">{copy.title}</h1>
                <p className="cv2-chapter-subtitle">{copy.subtitle}</p>
              </div>

              {!link ? (
                <section className="cv2-chapter cv2-chapter-flat">
                  <div className="cv2-form-grid">
                    {step === 0 && (
                      <>
                        <div className="cv2-fieldset wide cv2-theme-picker">
                          <span className="cv2-eyebrow cv2-theme-picker-eyebrow">Theme</span>
                          <button
                            type="button"
                            className="cv2-theme-trigger"
                            aria-haspopup="menu"
                            aria-expanded={themeMenu}
                            onClick={() => setThemeMenu((v) => !v)}
                          >
                            <span className="cv2-theme-swatch" style={{ background: `linear-gradient(135deg, ${previewPalette.primary}, ${previewPalette.secondary})` }}>
                              🎂
                            </span>
                            <span className="cv2-theme-trigger-copy">
                              <strong>{THEME_PRESETS[themePreset].label}</strong>
                              <em>{previewPalette.dark}</em>
                            </span>
                            <Circle d="m6 9 6 6 6-6" />
                          </button>
                          {themeMenu && (
                            <div className="cv2-theme-menu inline" role="menu">
                              {THEME_PRESET_LIST.map(([id, t]) => (
                                <button
                                  key={id}
                                  type="button"
                                  className={themePreset === id ? 'selected' : ''}
                                  onClick={() => {
                                    setThemePreset(id)
                                    setThemeMenu(false)
                                  }}
                                >
                                  <span className="cv2-theme-swatch" style={{ background: `linear-gradient(135deg, ${t.palette.primary}, ${t.palette.secondary})` }} />
                                  <span className="cv2-theme-trigger-copy">
                                    <strong>{t.label}</strong>
                                    <em>Celebration palette</em>
                                  </span>
                                  {themePreset === id && <Circle d="M20 6 9 17l-5-5" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <label className="cv2-field" data-validation-field="forName">
                          <span>
                            Birthday Person's Name <i data-required>*</i>
                          </span>
                          <input
                            value={forName}
                            onChange={(e) => {
                              setForName(e.target.value)
                              setError('')
                            }}
                            placeholder="e.g. Sony"
                            maxLength={24}
                            autoFocus
                          />
                          <em className="cv2-char-count">{forName.length} / 24</em>
                        </label>

                        <label className="cv2-field" data-validation-field="fromName">
                          <span>Your name</span>
                          <input
                            value={fromName}
                            onChange={(e) => setFromName(e.target.value)}
                            placeholder="How it should appear on the wish"
                            maxLength={24}
                          />
                          <em className="cv2-char-count">{fromName.length} / 24</em>
                        </label>

                        <div className="cv2-fieldset wide cv2-birthday-field">
                          <span className="cv2-eyebrow cv2-birthday-label">Birthday Date</span>
                          <input
                            type="date"
                            value={birthday}
                            disabled={!birthdayKnown}
                            onChange={(e) => setBirthday(e.target.value)}
                            className="date-input"
                          />
                          <div className="cv2-birthday-unknown-fields">
                            <button
                              type="button"
                              className="cv2-birthday-toggle"
                              aria-pressed={!birthdayKnown}
                              onClick={() => setBirthdayKnown((v) => !v)}
                            >
                              {birthdayKnown ? "I don't know the birth year" : 'Actually, I know the birth year'}
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {step === 1 && (
                      <>
                        <div className="cv2-fieldset wide">
                          <span className="cv2-eyebrow">Emotion of the wish</span>
                          <div className="cv2-chip-row">
                            {EMOTIONS.map((em) => (
                              <button
                                key={em.id}
                                type="button"
                                className={`cv2-chip-select ${emotion === em.id ? 'active' : ''}`}
                                style={emotion === em.id ? { borderColor: previewPalette.primary, color: previewPalette.primary } : undefined}
                                onClick={() => setEmotion(em.id)}
                              >
                                <span className="cv2-chip-icon">{em.icon}</span>
                                {em.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="cv2-fieldset wide">
                          <span className="cv2-eyebrow">Cake color</span>
                          <div className="cv2-color-row">
                            {CAKE_COLORS.map((c) => (
                              <button
                                key={c}
                                type="button"
                                className={`color-dot ${cakeColor === c ? 'active' : ''}`}
                                style={{ background: c }}
                                onClick={() => setCakeColor(c)}
                                aria-label={`cake color ${c}`}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="cv2-fieldset wide">
                          <span className="cv2-eyebrow">Wish link lifespan</span>
                          <div className="cv2-chip-row">
                            {EXPIRE_OPTIONS.map((e) => (
                              <button
                                key={e.id}
                                type="button"
                                className={`cv2-chip-select ${expire === e.id ? 'active' : ''}`}
                                onClick={() => setExpire(e.id)}
                              >
                                {e.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {step === 2 && (
                      <>
                        <label className="cv2-field wide">
                          <span>
                            Your personal message <small>(optional — auto-written if left blank)</small>
                          </span>
                          <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                            maxLength={500}
                            placeholder="Write something heartfelt, funny, or legendary…"
                          />
                          <em className="cv2-char-count">{message.length} / 500</em>
                        </label>

                        <div className="cv2-fieldset wide cv2-photo-uploader">
                          <span className="cv2-eyebrow">Add a few photos</span>
                          <label
                            className={`cv2-photo-dropzone ${memories.length > 0 ? 'filled' : ''}`}
                            style={{ ['--glow' as string]: previewPalette.primary }}
                          >
                            <input type="file" accept="image/*" multiple hidden onChange={(e) => handleUpload(e.target.files)} />
                            <span className="dz-icon">🖼️</span>
                            <strong>
                              {memories.length > 0 ? `${memories.length} memory photos attached` : 'Drop photos here'}
                            </strong>
                            <small>{memories.length > 0 ? 'Click to add more' : 'or click to browse the celebration album'}</small>
                          </label>
                          {memories.length > 0 && (
                            <div className="cv2-photo-thumb-strip">
                              {memories.map((m) => (
                                <span key={m.id} className="thumb">
                                  <img src={m.dataUrl} alt={m.caption} />
                                  <button
                                    type="button"
                                    className="cv2-photo-remove"
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
                      </>
                    )}

                    {step === 3 && (
                      <div className="cv2-fieldset wide">
                        <span className="cv2-eyebrow">Your wish at a glance</span>
                        <dl className="cv2-summary">
                          <div>
                            <dt>For</dt>
                            <dd>{forName || 'Birthday star'}</dd>
                          </div>
                          <div>
                            <dt>From</dt>
                            <dd>{fromName || 'A secret admirer'}</dd>
                          </div>
                          <div>
                            <dt>Birthday</dt>
                            <dd>{birthdayKnown && birthday ? new Date(birthday).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Mystery year'}</dd>
                          </div>
                          <div>
                            <dt>Emotion</dt>
                            <dd>{emoji?.icon} {emoji?.label}</dd>
                          </div>
                          <div>
                            <dt>Theme</dt>
                            <dd>{THEME_PRESETS[themePreset].label}</dd>
                          </div>
                          <div>
                            <dt>Photos</dt>
                            <dd>{memories.length}</dd>
                          </div>
                          <div>
                            <dt>Lifespan</dt>
                            <dd>{expiryLabel}</dd>
                          </div>
                        </dl>
                      </div>
                    )}
                  </div>

                  <div className="honeypot" aria-hidden="true">
                    <label>
                      Leave this field empty{' '}
                      <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                    </label>
                  </div>

                  {error && <p className="error-text">{error}</p>}
                </section>
              ) : (
                <section className="cv2-chapter cv2-chapter-flat">
                  <div className="share-card">
                    <div className="link-hero">
                      <span className="link-hero-icon">🔗</span>
                      <h3>Your wish link is ready!</h3>
                      <p>
                        Preview: “A birthday celebration for <strong>{forName}</strong>”
                      </p>
                      <div className="link-io">
                        <input readOnly value={link} onFocus={(e) => e.target.select()} />
                        <button onClick={() => navigator.clipboard?.writeText(link ?? '')}>Copy</button>
                      </div>
                      <div className="share-badge" style={{ ['--glow' as string]: previewPalette.primary }}>
                        <QrCode value={link} />
                        <p className="qr-hint">Scan to open the celebration on any phone.</p>
                      </div>
                      <div className="share-actions">
                        <button className="btn-primary" style={{ ['--glow' as string]: previewPalette.primary }} onClick={share}>
                          📤 Share the link
                        </button>
                        <button className="btn-secondary" onClick={downloadQr}>
                          🖨️ Save QR image
                        </button>
                        <button className="btn-ghost" onClick={() => setLink(null)}>
                          Make another
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {!link && (
                <YourPreviousLinks
                  onUse={(slug) => {
                    audio.whoosh()
                    useStore.getState().applyLink(slug)
                    setScreen('celebration')
                  }}
                />
              )}
            </div>
          </section>

          <aside className="cv2-shell-preview">
            <div className="cv2-preview-toolbar">
              <p className="cv2-preview-pane-label">Live preview <span>·</span> birthday</p>
            </div>
            <div className="cv2-preview-pane">
              <div className="cv2-preview-glow" />
              <div className="cv2-phone-mockup">
                <span className="cv2-phone-side cv2-phone-side-left" />
                <span className="cv2-phone-side cv2-phone-side-right" />
                <div className="cv2-phone-screen">
                  <div className="cv2-phone-notch" />
                  <div className="cv2-mobile-preview-screen">
                    <div className="cv2-mobile-card" style={{ ['--head' as string]: `linear-gradient(135deg, ${previewPalette.primary}, ${previewPalette.secondary})`, ['--glow' as string]: previewPalette.primary }}>
                      <div className="cv2-pc-head">
                        <span className="cv2-pc-emoji">🎂</span>
                        <h3>{forName || 'Birthday star'}</h3>
                        {birthdayKnown && birthday ? (
                          <p>{new Date(birthday).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        ) : (
                          <p>Surprise us — the year is a mystery</p>
                        )}
                        <small>With love, from {fromName || 'a secret admirer'}</small>
                      </div>
                      <div className="cv2-pc-body">
                        <span className="cv2-pc-tag">{emoji?.icon} {emoji?.label}</span>
                        <blockquote>
                          “{(message.trim() || generateWish(forName || 'friend', emotion)).split('\n\n')[1]?.replace(/\n/g, ' ')?.slice(0, 90) ?? 'A celebration made just for you.'}…”
                        </blockquote>
                        {memories.length > 0 && (
                          <div className="cv2-pc-photos">
                            {memories.slice(0, 3).map((m) => (
                              <span key={m.id} style={{ backgroundImage: `url(${m.dataUrl})` }} />
                            ))}
                          </div>
                        )}
                        <div className="cv2-pc-foot">
                          <span className="cv2-pc-expiry">⏳ {expiryLabel}</span>
                          <span className="cv2-pc-qr">QR ready on share</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="cv2-phone-home" />
                </div>
              </div>
            </div>
          </aside>
        </div>

        <footer className="cv2-shell-dock">
          <div className="cv2-floating-dock">
            <div className="cv2-nav-row">
              <button type="button" className="cv2-button" onClick={back} aria-label="Back">
                <Circle d="M19 12H5m7 7-7-7 7-7" />
                <span>{link ? 'Make another' : step === 0 ? 'Home' : 'Back'}</span>
              </button>
              <div className="cv2-nav-actions">
                {!link && step !== 3 && (
                  <button type="button" className="cv2-button cv2-preview-nav-button" onClick={goPreview} aria-label="Preview" title="Jump to final preview">
                    <Circle d="M2.06 12a10 10 0 0 1 19.88 0 10 10 0 0 1-19.88 0Z" />
                    <span>Preview</span>
                  </button>
                )}
                {!link ? (
                  <button type="button" className="cv2-cta-premium" onClick={step === 3 ? createLink : next}>
                    {step === 3 ? (
                      <>✨ Generate the wish link</>
                    ) : (
                      <>
                        Next
                        <Circle d="M5 12h14m-7-7 7 7-7 7" />
                      </>
                    )}
                  </button>
                ) : (
                  <button type="button" className="cv2-cta-premium" onClick={share}>
                    📤 Share the link
                  </button>
                )}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

function YourPreviousLinks({ onUse }: { onUse: (slug: string) => void }) {
  const links = readWishLinks()
  if (links.length === 0) return null
  return (
    <div className="prev-links">
      <h4>Previously created links</h4>
      {links.slice(0, 4).map((l) => (
        <button key={l.id} type="button" className="prev-link" onClick={() => onUse(l.slug)}>
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