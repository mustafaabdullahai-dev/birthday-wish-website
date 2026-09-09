import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { Palette } from '../types'
import { audio } from '../utils/audioEngine'

interface Props {
  name: string
  palette: Palette
  cakeColor: string
  cakeFrom?: string
  onBlow: () => void
  candlesOut: boolean
  cakeEmerging: boolean
}

function CSSConfetti({ colors }: { colors: string[] }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 6,
        duration: 4 + Math.random() * 5,
        size: 6 + Math.random() * 8,
        color: colors[i % colors.length],
        rotate: Math.random() * 360,
      })),
    [colors],
  )

  return (
    <div className="css-confetti" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="css-confetti-piece"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 1.4,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              transform: `rotate(${p.rotate}deg)`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

function BalloonField({ colors }: { colors: string[] }) {
  const balloons = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        left: (i / 10) * 100 + Math.random() * 6,
        delay: Math.random() * 8,
        duration: 12 + Math.random() * 8,
        size: 26 + Math.random() * 18,
        color: colors[i % colors.length],
      })),
    [colors],
  )

  return (
    <div className="css-balloon-field" aria-hidden>
      {balloons.map((b) => (
        <span
          key={b.id}
          className="css-balloon"
          style={
            {
              left: `${b.left}%`,
              width: b.size,
              height: b.size * 1.25,
              background: b.color,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.duration}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

export function WebGLFallback({ name, palette, cakeColor, cakeFrom, onBlow, candlesOut, cakeEmerging }: Props) {
  const colors = [palette.primary, palette.secondary, palette.accent, '#FFD700', '#ff9ff3', '#ffffff']
  const showCake = cakeEmerging || !candlesOut

  const handleBlow = () => {
    audio.hiss()
    onBlow()
  }

  return (
    <div
      className="fallback-scene"
      style={{ background: `radial-gradient(circle at 50% 30%, ${palette.dark}, #05030f 75%)` }}
    >
      <CSSConfetti colors={colors} />
      <BalloonField colors={colors} />

      {cakeFrom && (
        <div className="wish-badge">
          💌 A wish from <strong>{cakeFrom}</strong>
        </div>
      )}

      <motion.div
        className="fallback-cake"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: showCake ? 0 : 40, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 90, damping: 16, delay: 0.2 }}
        onClick={!candlesOut ? handleBlow : undefined}
        style={{ cursor: !candlesOut ? 'pointer' : 'default' }}
      >
        <div className="fallback-cake-inner">
          <div className="candle-row">
            {Array.from({ length: 3 }, (_, i) => (
              <span key={i} className={`fc-candle ${!candlesOut ? 'lit' : 'out'}`} style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <div className="fc-icing" style={{ color: palette.primary }}>
            {name.trim().toUpperCase().slice(0, 12)}
          </div>
          <div className="fc-tier fc-top" style={{ background: cakeColor }} />
          <div className="fc-tier fc-bottom" style={{ background: cakeColor }} />
          <div className="fc-plate" />
        </div>
      </motion.div>

      {!candlesOut && (
        <motion.button
          className="blow-hint"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          onClick={handleBlow}
        >
          🕯️ Tap the cake to blow out the candles!
        </motion.button>
      )}
    </div>
  )
}
