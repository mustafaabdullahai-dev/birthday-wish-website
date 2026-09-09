import { motion } from 'framer-motion'
import type { Palette } from '../types'

export function LoadingCandle({ palette }: { palette: Palette }) {
  return (
    <div className="loading-candle" role="status" aria-label="Preparing your celebration">
      <div className="loading-candle-inner">
        <motion.span
          className="loading-flame"
          initial={{ scale: 0, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4, ease: 'easeOut' }}
          style={{ background: palette.primary }}
        />
        <div className="loading-wick" />
        <div className="loading-body">
          <span />
        </div>
        <motion.p
          className="loading-label"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
        >
          Lighting the candles…
        </motion.p>
      </div>
    </div>
  )
}
