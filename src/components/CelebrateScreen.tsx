import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Palette, MemoryFile, ThemePreset } from '../types'
import { useStore } from '../store/useStore'
import { audio } from '../utils/audioEngine'
import { CelebrationScene } from '../scenes/CelebrationScene'
import { NameOverlay } from './NameOverlay'
import { LetterModal } from './LetterModal'
import { GiftStage } from './GiftStage'
import { GiftUnbox } from './GiftUnbox'
import { LoveMeter } from './LoveMeter'
import { generateWish } from '../utils/helpers'
import { useCanvasCapture } from '../hooks/useCanvasCapture'

interface Props {
  name: string
  palette: Palette
  cakeColor?: string
  cakeMessage?: string
  cakeFrom?: string
  cakeFromRole?: string
  cakeTemplate?: ThemePreset
  cakeBirthday?: string
  cakeBirthdayKnown?: boolean
  cakeMemories?: MemoryFile[]
}

export function CelebrateScreen({
  name,
  palette,
  cakeColor,
  cakeMessage,
  cakeFrom,
  cakeFromRole,
  cakeTemplate,
  cakeBirthday,
  cakeBirthdayKnown,
  cakeMemories,
}: Props) {
  const setStage = useStore((s) => s.setStage)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [stage, setLocalStage] = useState<'intro' | 'cake' | 'letter' | 'gifts'>('intro')
  const [candlesOut, setCandlesOut] = useState(false)
  const [cakeEmerging, setCakeEmerging] = useState(false)
  const [giftOpened, setGiftOpened] = useState(false)
  const [showLetter, setShowLetter] = useState(false)
  const [showGifts, setShowGifts] = useState(false)

  const message = useMemo(
    () => cakeMessage ?? generateWish(name, 'heartfelt'),
    [name, cakeMessage],
  )

  useEffect(() => {
    setStage('intro')
    setGiftOpened(false)
    audio.startMusic()
    return () => {
      setGiftOpened(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  const handleOpenGift = useCallback(() => {
    setGiftOpened(true)
    setCakeEmerging(true)
    setTimeout(() => {
      setLocalStage('cake')
      setStage('cake')
    }, 700)
  }, [setStage])

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
    setGiftOpened(false)
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
        cakeFrom={cakeFrom}
        template={cakeTemplate}
        activePhase={stage === 'letter' || stage === 'gifts' ? 'idle' : 'active'}
        canvasRef={canvasRef}
      />

      <AnimatePresence>
        {stage === 'intro' && !giftOpened && (
          <GiftUnbox
            key="gift-unbox"
            name={name}
            palette={palette}
            birthday={cakeBirthday}
            birthdayKnown={cakeBirthdayKnown}
            cakeFrom={cakeFrom}
            onOpen={handleOpenGift}
          />
        )}
      </AnimatePresence>

      {stage !== 'gifts' && <NameOverlay name={name} palette={palette} />}

      {cakeFrom && (
        <div className="wish-badge">
          {cakeFromRole ? (
            <>💌 A wish from your <strong>{cakeFromRole}</strong></>
          ) : (
            <>💌 A wish from <strong>{cakeFrom}</strong></>
          )}
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

      <CelebrateControls onRestart={restage} canvasRef={canvasRef} />

      <LoveMeter palette={palette} active={stage !== 'intro'} />

      <AnimatePresence>
        {showLetter && (
          <LetterModal
            name={name}
            message={message}
            fromName={cakeFrom}
            fromRole={cakeFromRole}
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
              onContinue={restage}
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

function CelebrateControls({ onRestart, canvasRef }: { onRestart: () => void; canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  const musicOn = useStore((s) => s.musicOn)
  const toggleMusic = useStore((s) => s.toggleMusic)
  const volume = useStore((s) => s.volume)
  const setVolume = useStore((s) => s.setVolume)
  const logout = useStore((s) => s.logout)
  const setScreen = useStore((s) => s.setScreen)
  const [uiLight, setUiLight] = useState(false)
  const [showMusicPicker, setShowMusicPicker] = useState(false)
  const [melody, setMelody] = useState<'happy-birthday' | 'waltz' | 'jazz'>('happy-birthday')
  const { captureAndDownload, recording, supported } = useCanvasCapture(() => canvasRef.current)

  useEffect(() => {
    audio.setVolume(volume)
  }, [volume])

  const pickMelody = (m: 'happy-birthday' | 'waltz' | 'jazz') => {
    setMelody(m)
    audio.setMelody(m)
    setShowMusicPicker(false)
  }

  const toggleUiTheme = () => {
    const next = !uiLight
    setUiLight(next)
    document.body.classList.toggle('ui-light', next)
    document.body.classList.toggle('ui-forced-dark', !next && window.matchMedia('(prefers-color-scheme: light)').matches)
  }

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
        title={musicOn ? 'Mute music' : 'Play music'}
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
      <button className="ctl" onClick={onRestart} aria-label="Replay celebration" title="Replay celebration">
        🔄
      </button>
      <button
        className="ctl"
        onClick={() => setShowMusicPicker((v) => !v)}
        aria-label="Choose music"
        title="Choose music"
      >
        🎵
      </button>
      {showMusicPicker && (
        <div className="music-picker">
          <button className={melody === 'happy-birthday' ? 'active' : ''} onClick={() => pickMelody('happy-birthday')}>
            🎶 Happy Birthday
          </button>
          <button className={melody === 'waltz' ? 'active' : ''} onClick={() => pickMelody('waltz')}>
            ⏱️ Waltz
          </button>
          <button className={melody === 'jazz' ? 'active' : ''} onClick={() => pickMelody('jazz')}>
            🎷 Jazz
          </button>
        </div>
      )}
      {supported && (
        <button
          className="ctl"
          onClick={() => void captureAndDownload()}
          aria-label="Download highlight clip"
          title="Download highlight clip"
          disabled={recording}
        >
          {recording ? '⏺️' : '🎬'}
        </button>
      )}
      <button className="ctl" onClick={toggleUiTheme} aria-label="Toggle UI theme" title="Toggle UI theme">
        {uiLight ? '🌙' : '☀️'}
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