/* Procedural audio engine using the Web Audio API.
   The "Happy Birthday" melody is public domain, synthesized here so no audio files are needed. */

class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private melodyGain: GainNode | null = null
  private melodyTimer: number | null = null
  private stepIndex = 0
  private nextNoteTime = 0
  playing = false
  volume = 0.7
  private on = true

  private static readonly BPM = 108
  private static readonly NOTE = 60 / AudioEngine.BPM

  /* Melody in scale degrees relative to C (C4 = 0). */
  private static readonly MELODY = [
    [0, 1], [0, 1], [2, 1], [0, 1], [4, 1], [2, 2],
    [0, 1], [0, 1], [2, 1], [0, 1], [5, 1], [4, 2],
    [0, 1], [0, 1], [9, 1], [7, 1], [4, 1], [2, 1], [4, 2],
  ]

  private static freq(degree: number, base = 261.63): number {
    return base * Math.pow(2, degree / 12)
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.volume
      this.master.connect(this.ctx.destination)
      this.melodyGain = this.ctx.createGain()
      this.melodyGain.gain.value = 0.32
      this.melodyGain.connect(this.master)
    }
    return this.ctx
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v))
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05)
    }
  }

  setEnabled(on: boolean) {
    this.on = on
    if (!on) this.stopMusic()
    else if (this.playing) this.startMusic()
  }

  resume() {
    const ctx = this.ensureContext()
    if (ctx.state === 'suspended') void ctx.resume()
  }

  private scheduleNote(time: number, degree: number, dur: number) {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = AudioEngine.freq(degree)
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.9, time + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur)
    osc.connect(gain)
    gain.connect(this.melodyGain as GainNode)
    osc.start(time)
    osc.stop(time + dur + 0.05)
  }

  private scheduler = () => {
    if (!this.ctx || !this.melodyGain) return
    const ahead = this.ctx.currentTime + 0.15
    while (this.nextNoteTime < ahead) {
      const [degree, beats] = AudioEngine.MELODY[this.stepIndex % AudioEngine.MELODY.length]
      this.scheduleNote(this.nextNoteTime, degree, AudioEngine.NOTE * (beats + 1))
      this.stepIndex += 1
      this.nextNoteTime += AudioEngine.NOTE * beats
    }
  }

  startMusic() {
    this.resume()
    if (!this.ctx || !this.on) return
    if (this.playing) return
    this.playing = true
    this.stepIndex = 0
    this.nextNoteTime = this.ctx.currentTime + 0.1
    this.melodyTimer = window.setInterval(this.scheduler, 50)
  }

  stopMusic() {
    this.playing = false
    if (this.melodyTimer !== null) {
      clearInterval(this.melodyTimer)
      this.melodyTimer = null
    }
  }

  private sfx(type: OscillatorType, f0: number, f1: number, dur: number, vol = 0.4, curve: 'exp' | 'lin' = 'exp') {
    const ctx = this.ensureContext()
    if (!this.master || !this.on) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    const t = ctx.currentTime
    osc.frequency.setValueAtTime(f0, t)
    if (curve === 'exp') osc.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur)
    else osc.frequency.linearRampToValueAtTime(f1, t + dur)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start(t)
    osc.stop(t + dur + 0.05)
  }

  pop() {
    this.sfx('square', 500, 60, 0.18, 0.32)
  }

  whoosh() {
    this.sfx('sine', 200, 900, 0.35, 0.2, 'lin')
  }

  hiss() {
    const ctx = this.ensureContext()
    if (!this.master || !this.on) return
    const t = ctx.currentTime
    const len = Math.floor(ctx.sampleRate * 0.45)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2)
    }
    const src = ctx.createBufferSource()
    const gain = ctx.createGain()
    src.buffer = buf
    gain.gain.value = 0.25
    src.connect(gain)
    gain.connect(this.master)
    src.start(t)
  }

  chime() {
    this.sfx('sine', 880, 880, 0.5, 0.22)
    window.setTimeout(() => this.sfx('sine', 1174.66, 1174.66, 0.6, 0.22), 120)
    window.setTimeout(() => this.sfx('sine', 1567.98, 1567.98, 0.8, 0.22), 240)
  }

  tick() {
    this.sfx('sine', 1600, 1800, 0.05, 0.08)
  }

  fanfare() {
    this.sfx('triangle', 523.25, 523.25, 0.25, 0.3)
    window.setTimeout(() => this.sfx('triangle', 659.25, 659.25, 0.25, 0.3), 160)
    window.setTimeout(() => this.sfx('triangle', 783.99, 783.99, 0.45, 0.3), 320)
  }
}

export const audio = new AudioEngine()