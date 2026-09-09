import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GuestbookEntry, Palette } from '../types'
import { fetchGuestbook, postGuestbookEntry } from '../store/useStore'
import { downscaleImage } from '../utils/helpers'
import { audio } from '../utils/audioEngine'

interface Props {
  slug: string
  palette: Palette
  onClose: () => void
}

export function GuestbookModal({ slug, palette, onClose }: Props) {
  const [entries, setEntries] = useState<GuestbookEntry[] | null>(null)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [photo, setPhoto] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchGuestbook(slug).then((entries) => setEntries(entries))
  }, [slug])

  const handlePhoto = useCallback((files: FileList | null) => {
    const f = files?.[0]
    if (!f) return
    downscaleImage(f, 800, 0.8)
      .then(setPhoto)
      .catch(() => {
        const reader = new FileReader()
        reader.onload = () => setPhoto(String(reader.result))
        reader.readAsDataURL(f)
      })
  }, [])

  const submit = async () => {
    if (!name.trim() || !message.trim()) {
      setError('Please add your name and a short message.')
      return
    }
    setSubmitting(true)
    setError('')
    const entry = await postGuestbookEntry(slug, { name: name.trim(), message: message.trim(), photo })
    setSubmitting(false)
    if (entry) {
      audio.chime()
      setEntries((prev) => [...(prev ?? []), entry])
      setName('')
      setMessage('')
      setPhoto(undefined)
      setDone(true)
    } else {
      setError('Could not post your entry — please try again.')
    }
  }

  return (
    <div className="guestbook" role="dialog" aria-label="Guestbook">
      <div className="guestbook-head">
        <h3 style={{ color: palette.primary }}>📖 Sign the guestbook</h3>
        <button className="letter-close" onClick={onClose} aria-label="Close guestbook">
          ✕
        </button>
      </div>

      <div className="guestbook-body">
        {!done ? (
          <div className="gb-form">
            <label>
              Your name
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Who is signing?" />
            </label>
            <label>
              Your message
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={500} placeholder="A wish, a memory, a joke…" />
            </label>
            <button className="gb-photo-btn" onClick={() => fileRef.current?.click()}>
              {photo ? '📷 Photo attached — change?' : '🖼️ Attach a photo (optional)'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handlePhoto(e.target.files)} />
            {photo && <img className="gb-photo-preview" src={photo} alt="preview" />}
            {error && <p className="error-text">{error}</p>}
            <button className="btn-primary" style={{ ['--glow' as string]: palette.primary }} onClick={() => void submit()} disabled={submitting}>
              {submitting ? 'Signing…' : '✍️ Sign the guestbook'}
            </button>
          </div>
        ) : (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="gb-done">
            <span className="gb-done-icon">🎉</span>
            <p>You have been added to the guestbook! Thank you for being part of this celebration.</p>
            <button className="btn-ghost" onClick={() => setDone(false)}>
              Sign another
            </button>
          </motion.div>
        )}

        <div className="gb-entries">
          <h4>Glad tidings ({entries ? entries.length : '…'})</h4>
          <AnimatePresence>
            {entries?.map((e) => (
              <motion.div key={e.id} className="gb-entry" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {e.photo && <img className="gb-entry-photo" src={e.photo} alt={`from ${e.name}`} />}
                <div className="gb-entry-text">
                  <strong>{e.name}</strong>
                  <p>{e.message}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {entries && entries.length === 0 && <p className="gb-empty">No entries yet — be the first to sign!</p>}
        </div>
      </div>
    </div>
  )
}