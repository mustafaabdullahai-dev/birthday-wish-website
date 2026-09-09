import { useState, useCallback, useRef } from 'react'
import type { Palette } from '../types'
import { audio } from '../utils/audioEngine'

interface Props {
  palette: Palette
  active: boolean
}

const MILESTONES: Record<number, string> = {
  10: 'Ten taps of love! 💖',
  25: '25 hearts and counting… 💗',
  50: 'Halfway to infinity! 💞',
  100: '100 — now that’s a party 😍',
}

export function LoveMeter({ palette, active }: Props) {
  const [hearts, setHearts] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const msgTimer = useRef<number | null>(null)
  const [particles, setParticles] = useState<number[]>([])

  const send = useCallback(() => {
    audio.tick()
    const next = hearts + 1
    setHearts(next)
    setParticles((p) => [...p.slice(-12), Date.now()])
    if (MILESTONES[next]) {
      setMessage(MILESTONES[next])
      if (msgTimer.current) window.clearTimeout(msgTimer.current)
      msgTimer.current = window.setTimeout(() => setMessage(null), 3400)
    }
  }, [hearts])

  const pct = Math.min(100, Math.round((hearts / 100) * 100))
  const infinityMode = hearts >= 100

  if (!active && hearts === 0) return null

  return (
    <div className="love-meter" style={{ ['--glow' as string]: palette.primary }} data-active={active || hearts > 0}>
      <button type="button" className="love-send" onClick={send} aria-label="Send love">
        <span className="love-heart">❤️</span>
        <b>{hearts}</b>
      </button>
      <div className="love-meter-bar" title="Love received">
        <span style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${palette.primary}, ${palette.secondary})` }} />
      </div>
      <span className="love-meter-label">{infinityMode ? '∞ love' : `${pct}%`}</span>
      {message && <p className="love-milestone">{message}</p>}
      <div className="love-burst" aria-hidden>
        {particles.map((key, i) => (
          <span key={key} style={{ animationDelay: `${i * 0.03}s` }}>
            {i % 2 === 0 ? '💖' : '💗'}
          </span>
        ))}
      </div>
    </div>
  )
}