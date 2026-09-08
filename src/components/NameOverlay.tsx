import { motion } from 'framer-motion'
import type { Palette } from '../types'

interface Props {
  name: string
  palette: Palette
  subtitle?: string
}

export function NameOverlay({ name, palette, subtitle }: Props) {
  return (
    <div className="name-overlay" aria-hidden>
      <motion.h1
        className="glam-name"
        initial={{ scale: 0.2, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
        style={{ '--gold': palette.primary, '--pink': palette.secondary, '--cyan': palette.accent } as React.CSSProperties}
      >
        {name}
      </motion.h1>
      <motion.p
        className="name-sub"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{ color: palette.glow }}
      >
        {subtitle ?? 'It’s your special day'}
      </motion.p>
    </div>
  )
}