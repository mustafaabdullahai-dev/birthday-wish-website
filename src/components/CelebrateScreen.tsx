import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Palette, MemoryFile } from '../types'
import { useStore } from '../store/useStore'
import { audio } from '../utils/audioEngine'
import { CelebrationScene } from '../scenes/CelebrationScene'
import { NameOverlay } from './NameOverlay'
import { LetterModal } from './LetterModal'
import { GiftStage } from './GiftStage'
import { generateWish } from '../utils/helpers'

interface Props {
  name: string
  palette: Palette
  cakeColor?: string
  cakeMessage?: string
  cakeFrom?: string
  cakeMemories?: MemoryFile[]
}

export function CelebrateScreen({ name, palette, cakeColor, cakeMessage, cakeFrom, cakeMemories }: Props) {
  const setStage = useStore((s) => s.setStage)
  const [stage, setLocalStage] = useState<'intro' | 'cake' | 'letter' | 'gifts'>('intro')
  const [candlesOut, setCandlesOut] = useState(false)
  const [cakeEmerging, setCakeEmerging] = useState(false)
  const [showLetter, setShowLetter] = useState(false)
  const [showGifts, setShowGifts] = useState(false)

  const message = useMemo(
    () => cakeMessage ?? generateWish(name, 'heartfelt'),
    [name, cakeMessage],
  )

  useEffect(() => {
    setStage('intro')
    const t1 = setTimeout(() => setCakeEmerging(true), 1600)
    const t2 = setTimeout(() => setLocalStage('cake'), 4200)
    audio.startMusic()
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  const handleBlow = useCallback(() => {
    setCandlesOut(true)
    setLocalStage('letter')
    setStage('letter')
    setTimeout(() => setShowLetter(true), 900)
  }, [setStage])

  const handleLetterClose = useCallback(() => {
    setShowLetter(false)
    setLocalStage('gifts')
    setStage('gifts')
    setTimeout(() => setShowGifts(true), 120)
  }, [setStage])

  const restage = useCallback(() => {
    setLocalStage('intro')
    setStage('intro')
    setCandlesOut(false)
    setShowLetter(false)
    setShowGifts(false)
    setCakeEmerging(false)
    setTimeout(() => {
      setCakeEmerging(true)
      setLocalStage('cake')
    }, 1600)
    audio.startMusic()
  }, [setStage])

  const cakeColorFinal = cakeColor ?? inferCakeColor(name)

  return (
    <div className="celebration-screen">
      <CelebrationScene
        name={name}
        palette={palette}
        cakeColor={cakeColorFinal}
        candlesOut={candlesOut}
        cakeEmerging={cakeEmerging}
        onBlow={handleBlow}
        activePhase={stage === 'letter' || stage === 'gifts' ? 'idle' : 'active'}
      />

      {stage !== 'gifts' && <NameOverlay name={name} palette={palette} />}

      {cakeFrom && (
        <div className="wish-badge">
          💌 A wish from <strong>{cakeFrom}</strong>
        </div>
      )}

      <AnimatePresence>
        {stage === 'cake' && !candlesOut && (
          <motion.button
            className="blow-hint"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 1.6, repeat: Infinity }}
            onClick={handleBlow}
          >
            🕯️ Tap the cake to blow out the candles!
          </motion.button>
        )}
      </AnimatePresence>

      <CelebrateControls onRestart={restage} />

      <AnimatePresence>
        {showLetter && (
          <LetterModal
            name={name}
            message={message}
            fromName={cakeFrom}
            palette={palette}
            onClose={handleLetterClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGifts && (
          <motion.div className="gifts-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GiftStage
              palette={palette}
              memories={cakeMemories ?? []}
              message={message}
              name={name}
              onContinue={() => {
                setCakeEmerging(true)
                restage()
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function inferCakeColor(name: string): string {
  const paletteMap = [
    '#FF9E9E',
    '#9ED8FF',
    '#FFE38F',
    '#B7E39E',
    '#D9B0FF',
    '#FFB6D9',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return paletteMap[hash % paletteMap.length]
}

function CelebrateControls({ onRestart }: { onRestart: () => void }) {
  const musicOn = useStore((s) => s.musicOn)
  const toggleMusic = useStore((s) => s.toggleMusic)
  const volume = useStore((s) => s.volume)
  const setVolume = useStore((s) => s.setVolume)
  const logout = useStore((s) => s.logout)
  const setScreen = useStore((s) => s.setScreen)

  useEffect(() => {
    audio.setVolume(volume)
  }, [volume])

  return (
    <div className="controls-bar">
      <button
        className="ctl"
        onClick={() => {
          toggleMusic()
          if (!musicOn) audio.startMusic()
          else audio.stopMusic()
        }}
        aria-label={musicOn ? 'Mute music' : 'Play music'}
      >
        {musicOn ? '🔊' : '🔇'}
      </button>
      <div className="vol-wrap">
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => {
            setVolume(Number(e.target.value))
            audio.setVolume(Number(e.target.value))
          }}
          aria-label="Volume"
        />
      </div>
      <button className="ctl" onClick={onRestart} aria-label="Replay celebration">
        🔄
      </button>
      <button
        className="ctl"
        onClick={() => {
          audio.stopMusic()
          logout()
          setScreen('login')
        }}
        aria-label="Celebrate someone else"
        title="Celebrate someone else"
      >
        👤
      </button>
    </div>
  )
}