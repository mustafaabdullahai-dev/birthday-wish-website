import { useState, useEffect, useCallback } from 'react'
import type { Palette } from '../types'
import { audio } from '../utils/audioEngine'
import { timeUntilBirthday } from '../utils/helpers'

interface Props {
  name: string
  palette: Palette
  birthday?: string
  birthdayKnown?: boolean
  onOpen: () => void
  cakeFrom?: string
}

const BURST_EMOJI = ['🎊', '✨', '💖', '🎉', '⭐', '🎈', '💫', '🧁']

function CountdownBlock({ birthday, palette }: { birthday: string; palette: Palette }) {
  const [parts, setParts] = useState(() => timeUntilBirthday(birthday))

  useEffect(() => {
    const iv = window.setInterval(() => setParts(timeUntilBirthday(birthday)), 1000)
    return () => window.clearInterval(iv)
  }, [birthday])

  if (!parts) return null

  return (
    <div className="gift-countdown" style={{ ['--glow' as string]: palette.primary }}>
      {parts.isToday || (parts.days === 0 && parts.hours === 0 && parts.mins === 0) ? (
        <h4 className="gift-today">It’s today! 🎂🎉</h4>
      ) : (
        <>
          <h4>Countdown to the birthday</h4>
          <div className="gift-ticker">
            <span>
              <b>{parts.days}</b> days
            </span>
            <span>
              <b>{parts.hours}</b> hrs
            </span>
            <span>
              <b>{parts.mins}</b> min
            </span>
            <span>
              <b>{parts.secs}</b> sec
            </span>
          </div>
        </>
      )}
    </div>
  )
}

export function GiftUnbox({ name, palette, birthday, birthdayKnown, onOpen, cakeFrom }: Props) {
  const [opened, setOpened] = useState(false)
  const [burst, setBurst] = useState<number[]>([])

  const open = useCallback(() => {
    if (opened) return
    audio.chime()
    setOpened(true)
    setBurst(Array.from({ length: 22 }, (_, i) => i))
    setTimeout(() => onOpen(), 900)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, onOpen])

  useEffect(() => {
    const t = setTimeout(open, 9000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`gift-unbox ${opened ? 'opened' : ''}`} style={{ ['--glow' as string]: palette.primary }}>
      {birthdayKnown && birthday && (
        <CountdownBlock birthday={birthday} palette={palette} />
      )}
      <div className="gift-unbox-copy">
        <h2>
          Happy Birthday, <em style={{ color: palette.primary }}>{name}</em>
        </h2>
        {cakeFrom && (
          <p className="gift-unbox-from">
            {cakeFrom ? `A gift from ${cakeFrom}` : 'A gift awaits you'}
          </p>
        )}
      </div>
      <button type="button" className="gift-shake-box" onClick={open} aria-label="Open your gift">
        <div className="gift-box-body" style={{ background: palette.primary }}>
          <span className="gift-box-ribbon-v" />
          <span className="gift-box-ribbon-h" style={{ background: palette.secondary }} />
          <span className="gift-bow" />
        </div>
        <div className="gift-box-lid" style={{ background: palette.secondary, boxShadow: `0 8px 24px ${palette.primary}55` }} />
      </button>
      <p className="gift-tap-hint">{opened ? 'It’s for you… 🎉' : 'Tap the box to open your wish'}</p>
      {burst.length > 0 && (
        <div className="gift-burst" aria-hidden>
          {burst.map((i) => (
            <span
              key={i}
              style={{
                left: `${18 + ((i * 37) % 64)}%`,
                animationDelay: `${(i % 8) * 0.06}s`,
                animationDuration: `${0.9 + (i % 5) * 0.18}s`,
              }}
            >
              {BURST_EMOJI[i % BURST_EMOJI.length]}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}