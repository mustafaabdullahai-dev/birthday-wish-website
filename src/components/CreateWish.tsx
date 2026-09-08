import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { Emotion, MemoryFile } from '../types'
import { useStore } from '../store/useStore'
import { saveWishLink, readWishLinks } from '../store/useStore'
import { paletteForName, uid, generateWish, todayISO, initials, downscaleImage } from '../utils/helpers'
import { audio } from '../utils/audioEngine'
import type { Palette } from '../types'

const EMOTIONS: { id: Emotion; label: string; icon: string }[] = [
  { id: 'joyful', label: 'Joyful', icon: '🥳' },
  { id: 'heartfelt', label: 'Heartfelt', icon: '💗' },
  { id: 'funny', label: 'Funny', icon: '🤣' },
  { id: 'inspiring', label: 'Inspiring', icon: '🚀' },
  { id: 'romantic', label: 'Romantic', icon: '💖' },
]

const CAKE_COLORS = ['#FF9E9E', '#9ED8FF', '#FFE38F', '#B7E39E', '#D9B0FF', '#FFB6D9', '#8FF0E0']

export function CreateWish({ palette }: { palette: Palette }) {
  const setScreen = useStore((s) => s.setScreen)
  const [forName, setForName] = useState('')
  const [fromName, setFromName] = useState('')
  const [emotion, setEmotion] = useState<Emotion>('joyful')
  const [cakeColor, setCakeColor] = useState('#FF9E9E')
  const [message, setMessage] = useState('')
  const [memories, setMemories] = useState<MemoryFile[]>([])
  const [link, setLink] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [compact, setCompact] = useState(false)

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

  const createLink = () => {
    const cleanFor = forName.trim()
    if (!cleanFor) {
      setError("Enter the birthday person's name")
      return
    }
    const cleanFrom = fromName.trim() || 'A secret admirer'
    const wishText = message.trim() || generateWish(cleanFor, emotion)
    audio.chime()
    const link = saveWishLink({
      forName: cleanFor,
      fromName: cleanFrom,
      emotion,
      message: wishText,
      cakeColor,
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

  return (
    <motion.div
      className="create-screen"
      style={{ background: `radial-gradient(circle at 20% 10%, ${palette.dark}, #05030f 75%)` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button className="back-btn" onClick={() => setScreen('login')}>
        ← Back
      </button>

      <div className="create-wrap">
        <h2 className="create-title">
          Create a wish link for <em style={{ color: palette.primary }}>someone special</em>
        </h2>
        <p className="create-sub">They open it, the celebration explodes. That’s it. That’s the magic.</p>

        {!link ? (
          <div className="create-card">
            <div className="field-row">
              <label>
                Birthday star’s name *
                <input
                  value={forName}
                  onChange={(e) => setForName(e.target.value)}
                  placeholder="e.g. Sony"
                  maxLength={24}
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
              <span className="field-label">
                Your personal message <small>(optional — the star will rewrite it as AI✨ else)</small>
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

            {error && <p className="error-text">{error}</p>}

            <button className="btn-primary" style={{ ['--glow' as string]: palette.primary }} onClick={createLink}>
              ✨ Generate the wish link
            </button>
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
              <div className="share-actions">
                <button className="btn-primary" style={{ ['--glow' as string]: palette.primary }} onClick={share}>
                  📤 Share the link
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