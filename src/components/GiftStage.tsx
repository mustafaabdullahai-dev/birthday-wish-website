import { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Palette, MemoryFile } from '../types'
import { audio } from '../utils/audioEngine'
import { initials } from '../utils/helpers'
import { useStore } from '../store/useStore'
import { GuestbookModal } from './GuestbookModal'

interface BoxProps {
  palette: Palette
  memories: MemoryFile[]
  message: string
  name: string
  onContinue: () => void
}

const BOX_COLORS = ['#FF6B6B', '#4ECDC4', '#FFD93D']

function GiftStage({ palette, memories, message, name, onContinue }: BoxProps) {
  const [opened, setOpened] = useState<number | null>(null)
  const [showGuestbook, setShowGuestbook] = useState(false)
  const linkSeed = useStore((s) => s.linkSeed)
  const hasImages = memories.some((m) => m.type === 'image')
  const hasText = memories.some((m) => m.type === 'text')

  const boxes = useMemo(
    () => [
      { id: 0, label: hasImages ? 'Memories' : 'Images', icon: '📸', available: memories.length > 0 },
      { id: 1, label: 'Messages', icon: '💬', available: hasText || true },
      { id: 2, label: 'Surprise', icon: '🎉', always: true },
    ],
    [hasImages, hasText, memories.length],
  )

  const openBox = useCallback((id: number) => {
    audio.chime()
    setOpened(id)
  }, [])

  const closeBox = useCallback(
    (id: number) => {
      audio.whoosh()
      setOpened(null)
      if (id === 2) onContinue()
    },
    [onContinue],
  )

  return (
    <div className="gift-stage">
      <h2 className="gift-title">
        Three gifts await you, <em style={{ color: palette.primary }}>{name}</em> 🎁
      </h2>
      <p className="gift-sub">Open each one at your own pace…</p>

      <div className="gift-row">
        {boxes.map((box, i) => (
          <motion.button
            key={box.id}
            className="gift-box-btn"
            initial={{ opacity: 0, y: 40, rotate: i % 2 === 0 ? -6 : 6 }}
            animate={{ opacity: 1, y: [0, -8, 0], rotate: 0 }}
            transition={{ delay: 0.15 * i, repeat: Infinity, repeatDelay: 2.4, duration: 1.6 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openBox(box.id)}
            style={{ '--box': BOX_COLORS[i % 3], '--glow': palette.primary } as React.CSSProperties}
          >
            <span className="gift-icon">{box.icon}</span>
            <span className="gift-label">{box.label}</span>
            {!box.available && box.id === 0 && <span className="gift-note">empty for now</span>}
          </motion.button>
        ))}
        {linkSeed && (
          <motion.button
            className="gift-box-btn guestbook-box"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: [0, -8, 0] }}
            transition={{ delay: 0.45, repeat: Infinity, repeatDelay: 2.8, duration: 1.6 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              audio.chime()
              setShowGuestbook(true)
            }}
            style={{ '--box': '#B19CD9', '--glow': palette.primary } as React.CSSProperties}
          >
            <span className="gift-icon">📖</span>
            <span className="gift-label">Guestbook</span>
            <span className="gift-note">sign it ❤️</span>
          </motion.button>
        )}
      </div>

      {showGuestbook && linkSeed && <GuestbookModal slug={linkSeed} palette={palette} onClose={() => setShowGuestbook(false)} />}

      <AnimatePresence>
        {opened === 0 && (
          <BoxModal
            key="box0"
            title="Your Memories"
            glow={BOX_COLORS[0]}
            onShut={() => closeBox(0)}
            palette={palette}
          >
            {memories.length > 0 ? (
              <MemoryGallery memories={memories} />
            ) : (
              <EmptyMemories palette={palette} />
            )}
          </BoxModal>
        )}
        {opened === 1 && (
          <BoxModal key="box1" title="Messages & Wishes" glow={BOX_COLORS[1]} onShut={() => closeBox(1)} palette={palette}>
            <MessagesView memory={memories.find((m) => m.type === 'text')} phrase={message} />
          </BoxModal>
        )}
        {opened === 2 && (
          <BoxModal key="box2" title="The Grand Surprise" glow={BOX_COLORS[2]} onShut={() => closeBox(2)} palette={palette}>
            <SurpriseView palette={palette} name={name} memories={memories} />
          </BoxModal>
        )}
      </AnimatePresence>
    </div>
  )
}

function BoxModal({
  children,
  title,
  glow,
  onShut,
  palette,
}: {
  children: React.ReactNode
  title: string
  glow: string
  onShut: () => void
  palette: Palette
}) {
  return (
    <motion.div className="box-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="box-card"
        initial={{ y: 90, scale: 0.8, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1, rotateY: [0, 360] }}
        exit={{ y: 90, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
        style={{ borderColor: glow, boxShadow: `0 24px 80px ${glow}66` }}
      >
        <div className="box-modal-head">
          <h3 style={{ color: palette.primary }}>{title}</h3>
          <button onClick={onShut} className="letter-close" aria-label="Close box">
            ✕
          </button>
        </div>
        <div className="box-modal-body">{children}</div>
      </motion.div>
    </motion.div>
  )
}

function MemoryGallery({ memories }: { memories: MemoryFile[] }) {
  const [active, setActive] = useState<number | null>(null)

  if (memories.length === 0) return null
  return (
    <>
      <div className="memory-grid">
        {memories.map((m, i) =>
          m.type === 'text' ? null : (
            <motion.button
              key={m.id}
              className="memory-tile"
              whileHover={{ scale: 1.05, zIndex: 2 }}
              onClick={() => setActive(i)}
            >
              {m.type === 'image' && m.dataUrl ? (
                <img src={m.dataUrl} alt={m.caption || 'memory'} loading="lazy" />
              ) : (
                <div className="memory-fallback">
                  {m.caption || 'A beautiful memory'}
                </div>
              )}
              {m.caption && <span className="memory-cap">{m.caption}</span>}
            </motion.button>
          ),
        )}
      </div>
      <AnimatePresence>
        {active !== null && (
          <Lightbox file={memories[active]} onClose={() => setActive(null)} />
        )}
      </AnimatePresence>
    </>
  )
}

function Lightbox({ file, onClose }: { file: MemoryFile; onClose: () => void }) {
  return (
    <motion.div className="lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      {file.type === 'image' && file.dataUrl ? (
        <motion.img
          src={file.dataUrl}
          alt={file.caption || 'memory'}
          initial={{ scale: 0.7 }}
          animate={{ scale: 1 }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="lightbox-text">{file.message || file.caption || 'A cherished memory'}</div>
      )}
      {file.caption && <p className="lightbox-cap">{file.caption}</p>}
    </motion.div>
  )
}

function EmptyMemories({ palette }: { palette: Palette }) {
  const [uploaded, setUploaded] = useState<MemoryFile[]>([])
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, 8)
      .forEach((f) => {
        const reader = new FileReader()
        reader.onload = () => {
          setUploaded((prev) => {
            const next: MemoryFile = {
              id: `${Date.now()}${Math.random()}`,
              type: 'image',
              dataUrl: String(reader.result),
              caption: f.name,
              uploadedAt: new Date().toISOString(),
            }
            return [...prev, next]
          })
        }
        reader.readAsDataURL(f)
      })
  }, [])

  return (
    <div className="empty-mem">
      {uploaded.length === 0 ? (
        <>
          <p className="empty-title">No memories have been uploaded for you yet</p>
          <p className="empty-sub">
            Share your wish link so friends can add photos & videos. You can also drop your own below!
          </p>
          <label
            className={`dropzone ${dragOver ? 'over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              handleFiles(e.dataTransfer.files)
            }}
            style={{ ['--glow' as string]: palette.primary }}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              hidden
            />
            <span className="dz-icon">🖼️</span>
            <span>Drag & drop photos here, or <em>click to browse</em></span>
          </label>
        </>
      ) : (
        <MemoryGallery memories={uploaded} />
      )}
    </div>
  )
}

function MessagesView({ memory, phrase }: { memory?: MemoryFile; phrase: string }) {
  return (
    <div className="messages-view">
      <div className="msg-card">
        <div className="msg-from">
          <span className="avatar-mini">{memory?.from ? initials(memory.from) : '💌'}</span>
          <strong>{memory?.from ?? 'A friend'}</strong>
        </div>
        <p>{memory?.message ?? 'Wishing you the most wonderful year ahead!'}</p>
      </div>
      <div className="msg-card accent">
        <div className="msg-from">
          <span className="avatar-mini">✨</span>
          <strong>The celebration wish</strong>
        </div>
        <p className="msg-quote">“{phrase}”</p>
      </div>
    </div>
  )
}

function SurpriseView({
  palette,
  name,
  memories,
}: {
  palette: Palette
  name: string
  memories: MemoryFile[]
}) {
  const imgs = memories.filter((m) => m.type === 'image' && m.dataUrl).slice(0, 4)
  useEffect(() => {
    audio.fanfare()
  }, [])
  return (
    <div className="surprise-view">
      <div className="surprise-confetti">🎊</div>
      <h4 style={{ color: palette.primary }}>It’s YOU, {name}!</h4>
      {imgs.length > 0 ? (
        <div className="collage">
          {imgs.map((img, i) => (
            <div key={img.id} className={`collage-cell c${i}`}>
              <img src={img.dataUrl} alt={img.caption || ''} />
            </div>
          ))}
        </div>
      ) : (
        <div className="surprise-card">
          <span>🕰️</span>
          <p>Every second of this celebration exists because you exist. That is the real surprise.</p>
        </div>
      )}
      <p className="surprise-footer">Make this year unforgettable — the world is cheering for you.</p>
    </div>
  )
}

export default GiftStage
export { GiftStage }