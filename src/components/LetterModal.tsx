import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Palette } from '../types'
import { audio } from '../utils/audioEngine'
import { surpriseFact } from '../utils/helpers'

interface Props {
  name: string
  message: string
  fromName?: string
  palette: Palette
  onClose: () => void
}

function splitMessage(message: string, name: string): { segments: string[]; isName: boolean[] } {
  const parts: string[] = []
  const flags: boolean[] = []
  const re = new RegExp(`(${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i')
  const lines = message.split('\n')
  lines.forEach((line) => {
    const sub = line.split(re)
    sub.forEach((s) => {
      if (s.length === 0) return
      parts.push(s)
      flags.push(s.toLowerCase() === name.toLowerCase())
    })
    parts.push('\n')
    flags.push(false)
  })
  return { segments: parts, isName: flags }
}

function insertable(seg: string): boolean {
  return seg.trim().length > 0 && seg !== '\n'
}

export function LetterModal({ name, message, fromName, palette, onClose }: Props) {
  const [opened, setOpened] = useState(false)
  const fact = useMemo(() => surpriseFact(name), [name])

  const open = () => {
    setOpened(true)
    audio.chime()
  }

  return (
    <motion.div
      className="letter-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => {
        if (opened) return
        open()
      }}
    >
      <AnimatePresence mode="wait">
        {!opened ? (
          <motion.div
            key="envelope"
            className="envelope"
            initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0, y: [0, -10, 0] }}
            exit={{ scale: 0.5, opacity: 0, y: 60 }}
            transition={{ type: 'spring', stiffness: 140, damping: 12 }}
          >
            <div className="env-body" style={{ background: palette.dark }}>
              <span className="env-flap" />
              <span className="env-heart" style={{ color: palette.primary }}>
                💌
              </span>
            </div>
            <motion.p className="env-prompt" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 2 }}>
              A special message is waiting… tap to open
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="letter"
            className="letter-sheet"
            initial={{ y: 120, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 16 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Birthday wish"
          >
            <button className="letter-close" onClick={onClose} aria-label="Close letter">
              ✕
            </button>
            <div className="letter-inner">
              <LetterBody message={message} name={name} fromName={fromName} palette={palette} />
              <div className="surprise-line">✨ {fact}</div>
            </div>
            <div className="letter-actions">
              <button className="btn-ghost" onClick={onClose}>
                Continue to your gifts →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function LetterBody({ message, name, fromName, palette }: { message: string; name: string; fromName?: string; palette: Palette }) {
  const { segments, isName } = useMemo(() => splitMessage(message, name), [message, name])
  const [count, setCount] = useState(0)
  const speed = 22

  useEffect(() => {
    setCount(0)
    let i = 0
    const iv = window.setInterval(() => {
      i += 1
      if (i > segments.length) {
        clearInterval(iv)
        return
      }
      setCount(i)
      const segNow = segments[i - 1]
      if (insertable(segNow)) audio.tick()
    }, speed)
    return () => clearInterval(iv)
  }, [name, message, segments, speed])

  const visible = segments.slice(0, count)
  const pending = segments.slice(count)

  return (
    <div className="letter-text">
      {visible.map((seg, i) =>
        isName[i] ? (
          <span key={i} className="hl-name" style={{ color: palette.primary, textShadow: `0 0 18px ${palette.glow}` }}>
            {seg}
          </span>
        ) : seg === '\n' ? (
          <br key={i} />
        ) : (
          <span key={i}>{seg}</span>
        ),
      )}
      {pending.length > 0 && <span className="cursor-blink">▍</span>}
      {count >= segments.length && fromName && (
        <div className="letter-sign">
          — with love, <strong>{fromName}</strong>
        </div>
      )}
    </div>
  )
}