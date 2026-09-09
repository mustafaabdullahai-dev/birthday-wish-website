import { GIFEncoder, quantize, applyPalette } from 'gifenc'
import type { ThemePreset, CardArt } from '../types'
import { THEME_PRESETS, initials, slugify } from './helpers'

export interface CardExportOptions {
  template: ThemePreset
  forName: string
  fromName: string
  fromRole?: string
  toRole?: string
  birthdayLabel?: string
  message: string
  photo?: string | null
  width?: number
  height?: number
}

const CARD_W = 720
const CARD_H = 1008

function fract(n: number): number {
  return n - Math.floor(n)
}

function rr(x: number): number {
  return Math.sin(x * 12.9898 + 78.233) * 43758.5453 - Math.floor(Math.sin(x * 12.9898 + 78.233) * 43758.5453)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function drawArt(ctx: CanvasRenderingContext2D, art: CardArt, w: number, h: number, t: number, primary: string, secondary: string) {
  ctx.save()
  const count = Math.round((w * h) / 12000)
  ctx.globalAlpha = 0.55
  switch (art) {
    case 'confetti':
      for (let i = 0; i < count; i += 1) {
        const x = fract(rr(i) * 97) * w
        const y = ((fract(rr(i + 91) * 131) + t * 0.6) % 1) * h
        ctx.fillStyle = i % 2 === 0 ? primary : secondary
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(rr(i + 7) * Math.PI)
        ctx.fillRect(-3, -5, 6, 10)
        ctx.restore()
      }
      break
    case 'balloons':
      for (let i = 0; i < 14; i += 1) {
        const x = fract(rr(i) * 97) * w
        const baseY = fract(rr(i + 3) * 131) * h
        const y = baseY + Math.sin(t * Math.PI * 2 + i) * 14 - 30
        ctx.fillStyle = i % 2 === 0 ? primary : secondary
        ctx.beginPath()
        ctx.ellipse(x, y, 20, 26, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.45)'
        ctx.beginPath()
        ctx.moveTo(x, y + 26)
        ctx.quadraticCurveTo(x + 3, y + 40, x + 2, y + 52)
        ctx.stroke()
      }
      break
    case 'stars':
      for (let i = 0; i < count; i += 1) {
        const x = fract(rr(i) * 97) * w
        const y = fract(rr(i + 13) * 131) * h
        const s = 2 + (fract(rr(i + 5)) * 2)
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 4 + i * 1.7))
        ctx.fillStyle = i % 2 === 0 ? primary : secondary
        ctx.globalAlpha = 0.3 + 0.5 * tw
        ctx.beginPath()
        for (let k = 0; k < 4; k += 1) {
          const a = (k * Math.PI) / 2
          ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s)
          ctx.lineTo(x + Math.cos(a + Math.PI / 4) * s * 0.4, y + Math.sin(a + Math.PI / 4) * s * 0.4)
        }
        ctx.closePath()
        ctx.fill()
        ctx.globalAlpha = 0.55
      }
      break
    case 'hearts':
      for (let i = 0; i < 16; i += 1) {
        const x = fract(rr(i) * 97) * w
        const y = fract(rr(i + 4) * 131) * h + Math.sin(t * 2 + i) * 8
        ctx.fillStyle = i % 2 === 0 ? primary : secondary
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(rr(i) * 0.6 - 0.3)
        ctx.beginPath()
        ctx.moveTo(0, 6)
        ctx.bezierCurveTo(-14, -8, -8, -18, 0, -8)
        ctx.bezierCurveTo(8, -18, 14, -8, 0, 6)
        ctx.fill()
        ctx.restore()
      }
      break
    case 'sparkle':
      ctx.fillStyle = primary
      for (let i = 0; i < count; i += 1) {
        const x = fract(rr(i) * 97) * w
        const y = fract(rr(i + 21) * 131) * h
        ctx.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(t * 3 + i * 2.3))
        ctx.beginPath()
        ctx.arc(x, y, 1.4, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 0.55
      const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.75)
      g.addColorStop(0, 'rgba(255,255,255,0.12)')
      g.addColorStop(1, 'rgba(0,0,0,0.42)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      break
    case 'rays':
      const rg = ctx.createConicGradient(t * Math.PI, w / 2, h / 2)
      for (let i = 0; i < 12; i += 1) {
        const a = i / 12
        rg.addColorStop(a, 'rgba(255,255,255,0)')
        rg.addColorStop(a + 0.03, i % 2 === 0 ? primary : secondary)
        rg.addColorStop(a + 0.06, 'rgba(255,255,255,0)')
      }
      ctx.fillStyle = rg
      ctx.fillRect(0, 0, w, h)
      ctx.globalAlpha = 0.4
      break
    case 'fireworks':
      for (let b = 0; b < 3; b += 1) {
        const cx = fract(rr(b + 9) * 97) * w
        const cy = fract(rr(b + 19) * 131) * h * 0.5
        const phase = (t + b / 3) % 1
        const radius = phase * 120
        const alpha = Math.sin(phase * Math.PI)
        ctx.globalAlpha = 0.5 + alpha * 0.4
        ctx.strokeStyle = b % 2 === 0 ? primary : secondary
        ctx.lineWidth = 2
        for (let k = 0; k < 16; k += 1) {
          const a = (k * Math.PI * 2) / 16
          ctx.beginPath()
          ctx.moveTo(cx, cy)
          ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius)
          ctx.stroke()
        }
      }
      ctx.globalAlpha = 0.55
      break
    case 'waves':
      ctx.globalAlpha = 0.5
      for (let k = 0; k < 3; k += 1) {
        ctx.strokeStyle = k % 2 === 0 ? primary : secondary
        ctx.lineWidth = 10 - k * 2
        ctx.beginPath()
        const baseY = h * (0.75 + k * 0.09)
        for (let x = 0; x <= w; x += 8) {
          const y = baseY + Math.sin(x * 0.02 + t * Math.PI * 2 + k * 1.2) * 18
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      break
    case 'flowers':
      for (let i = 0; i < 24; i += 1) {
        const x = ((fract(rr(i) * 97)) * w)
        const y = ((fract(rr(i + 8) * 131)) * h)
        const s = 6 + fract(rr(i + 2)) * 6
        ctx.fillStyle = i % 2 === 0 ? primary : secondary
        ctx.save()
        ctx.translate(x, y)
        ctx.globalAlpha = 0.35
        for (let p = 0; p < 5; p += 1) {
          ctx.beginPath()
          ctx.arc(Math.cos((p * Math.PI * 2) / 5) * s, Math.sin((p * Math.PI * 2) / 5) * s, s * 0.6, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.beginPath()
        ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.fill()
        ctx.restore()
        ctx.globalAlpha = 0.5
      }
      break
    case 'dots':
      for (let i = 0; i < count; i += 1) {
        const x = fract(rr(i) * 97) * w
        const y = fract(rr(i + 14) * 131) * h
        ctx.fillStyle = i % 2 === 0 ? primary : secondary
        ctx.globalAlpha = 0.18 + 0.25 * Math.abs(Math.sin(t * 2 + i * 1.3))
        ctx.beginPath()
        ctx.arc(x, y, 5 + fract(rr(i + 3)) * 6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 0.55
      break
    default:
      break
  }
  ctx.restore()
}

function drawCard(ctx: CanvasRenderingContext2D, w: number, h: number, o: CardExportOptions, t: number, photo?: HTMLImageElement | null) {
  const preset = THEME_PRESETS[o.template]
  const p = preset.palette
  const { primary, secondary, accent, background, dark, glow } = p
  const art = preset.cardArt

  const [br, bg, bb] = background
  const baseGrad = ctx.createLinearGradient(0, 0, w, h * 0.6)
  baseGrad.addColorStop(0, dark)
  baseGrad.addColorStop(0.55, `rgb(${br},${bg},${bb})`)
  baseGrad.addColorStop(1, dark)
  ctx.fillStyle = baseGrad
  ctx.fillRect(0, 0, w, h)

  drawArt(ctx, art, w, h, t, primary, secondary)

  ctx.save()
  ctx.fillStyle = `rgba(${br},${bg},${bb},0.28)`
  ctx.fillRect(0, 0, w, h)
  ctx.restore()

  const cx = w / 2
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const letterTop = h * 0.06
  ctx.fillStyle = glow
  ctx.globalAlpha = 0.9
  ctx.font = `500 ${Math.round(h * 0.022)}px Georgia, 'Times New Roman', serif`
  ctx.shadowColor = glow
  ctx.shadowBlur = 12
  ctx.fillText('H A P P Y   B I R T H D A Y', cx, letterTop)
  ctx.shadowBlur = 0
  ctx.globalAlpha = 1

  const emblemY = h * 0.155
  const emblemR = h * 0.065
  ctx.beginPath()
  ctx.arc(cx, emblemY, emblemR + 7, 0, Math.PI * 2)
  ctx.strokeStyle = accent
  ctx.lineWidth = 3
  ctx.globalAlpha = 0.85
  ctx.stroke()
  ctx.globalAlpha = 1

  const eg = ctx.createLinearGradient(cx - emblemR, emblemY - emblemR, cx + emblemR, emblemY + emblemR)
  eg.addColorStop(0, primary)
  eg.addColorStop(1, secondary)
  ctx.beginPath()
  ctx.arc(cx, emblemY, emblemR, 0, Math.PI * 2)
  ctx.fillStyle = eg
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = `700 ${Math.round(emblemR * 0.9)}px Georgia, serif`
  ctx.fillText(initials(o.forName || '?'), cx, emblemY + 1)

  const nameY = h * 0.30
  let nameFont = h * 0.075
  ctx.font = `700 ${Math.round(nameFont)}px Georgia, 'Times New Roman', serif`
  let nameLines = wrapText(ctx, o.forName || 'Birthday Star', w * 0.82)
  while (nameLines.length > 2 && nameFont > h * 0.045) {
    nameFont *= 0.9
    ctx.font = `700 ${Math.round(nameFont)}px Georgia, 'Times New Roman', serif`
    nameLines = wrapText(ctx, o.forName || 'Birthday Star', w * 0.82)
  }
  const nameGrad = ctx.createLinearGradient(0, nameY - 30, 0, nameY + 30)
  nameGrad.addColorStop(0, `#ffffff`)
  nameGrad.addColorStop(0.55, glow)
  nameGrad.addColorStop(1, primary)
  ctx.fillStyle = nameGrad
  ctx.shadowColor = glow
  ctx.shadowBlur = 26
  nameLines.forEach((line, i) => {
    ctx.fillText(line, cx, nameY + i * nameFont * 1.15)
  })
  ctx.shadowBlur = 0

  const roleLine = o.fromRole
  if (roleLine) {
    const roleText = o.toRole ? `${roleLine} · ${o.toRole}` : roleLine
    ctx.globalAlpha = 0.95
    ctx.fillStyle = secondary
    ctx.font = `600 ${Math.round(h * 0.028)}px Georgia, serif`
    ctx.fillText(roleText, cx, nameY + nameLines.length * nameFont * 1.15 + h * 0.045)
    ctx.globalAlpha = 1
  }

  if (o.birthdayLabel) {
    ctx.fillStyle = glow
    ctx.font = `500 ${Math.round(h * 0.024)}px Georgia, serif`
    ctx.globalAlpha = 0.9
    ctx.fillText(o.birthdayLabel, cx, nameY + nameLines.length * nameFont * 1.15 + h * (o.fromRole ? 0.088 : 0.052))
    ctx.globalAlpha = 1
  }

  const dividerY = h * 0.46
  ctx.globalAlpha = 0.6
  ctx.strokeStyle = glow
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.24, dividerY)
  ctx.lineTo(cx + w * 0.24, dividerY)
  ctx.stroke()
  ctx.fillStyle = accent
  ctx.save()
  ctx.translate(cx, dividerY)
  ctx.rotate(Math.PI / 4)
  ctx.fillRect(-4, -4, 8, 8)
  ctx.restore()
  ctx.globalAlpha = 1

  const msgFontBase = Math.round(h * 0.026)
  ctx.font = `500 ${msgFontBase}px Georgia, serif`
  ctx.fillStyle = '#fdfaf3'
  let msgLines = wrapText(ctx, o.message, w * 0.78)
  let msgFont = msgFontBase
  while (msgLines.length > 5 && msgFont > h * 0.017) {
    msgFont = Math.round(msgFont * 0.92)
    ctx.font = `500 ${msgFont}px Georgia, serif`
    msgLines = wrapText(ctx, o.message, w * 0.78)
  }
  const msgY0 = h * 0.52
  const lineH = msgFont * 1.5
  msgLines.forEach((line, i) => {
    ctx.fillStyle = i % 2 === 0 ? '#fdfaf3' : '#e9e4d8'
    ctx.fillText(line, cx, msgY0 + i * lineH)
  })

  let nextY = msgY0 + msgLines.length * lineH + h * 0.03

  if (photo) {
    const pw = w * 0.3
    const ph = pw * 0.76
    const px = cx - pw / 2
    const py = nextY
    ctx.save()
    ctx.translate(cx, py + ph / 2)
    ctx.rotate(-0.03)
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(0,0,0,0.45)'
    ctx.shadowBlur = 22
    ctx.fillRect(px - cx - 8, -ph / 2 - 8, pw + 16, ph + 28)
    ctx.shadowBlur = 0
    try {
      ctx.drawImage(photo, px - cx, -ph / 2, pw, ph)
    } catch {
      ctx.fillStyle = primary
      ctx.fillRect(px - cx, -ph / 2, pw, ph)
    }
    ctx.restore()
    nextY += ph + h * 0.03
  }

  ctx.fillStyle = accent
  ctx.font = `600 ${Math.round(h * 0.02)}px Georgia, serif`
  ctx.globalAlpha = 0.9
  ctx.fillText('✦', cx, nextY)
  ctx.globalAlpha = 1

  const wrapY = nextY + h * 0.02
  ctx.fillStyle = 'rgba(253,250,243,0.95)'
  ctx.font = `500 ${Math.round(h * 0.026)}px Georgia, serif`
  let fromLine = `with love, from ${o.fromName || 'a secret admirer'}`
  if (o.fromRole) fromLine = `from your ${o.fromRole}, ${o.fromName || 'a secret admirer'}`
  ctx.fillText(fromLine, cx, wrapY)

  const glowT = 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2))
  ctx.fillStyle = `rgba(255,255,255,${glowT})`
  ctx.font = `${Math.round(h * 0.022)}px Georgia, serif`
  ctx.fillText('🎂', cx + (0.5 + Math.sin(t * 6) * 0.5) * w * 0.36, h * 0.925)
}

export interface ExportResult {
  blob: Blob
  filename: string
}

export function cardFilename(base: string, ext: string): string {
  return `wishing-card-${slugify(base || 'birthday')}.${ext}`
}

export async function exportCardPoster(o: CardExportOptions): Promise<ExportResult | null> {
  const w = o.width ?? CARD_W
  const h = o.height ?? CARD_H
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const photo = o.photo ? await loadImage(o.photo).catch(() => null) : null
  drawCard(ctx, w, h, o, 0.25, photo)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  return blob ? { blob, filename: cardFilename(o.forName, 'png') } : null
}

export async function exportCardGif(o: CardExportOptions): Promise<ExportResult | null> {
  const w = o.width ?? 480
  const h = o.height ?? Math.round(w * (CARD_H / CARD_W))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  const photo = o.photo ? await loadImage(o.photo).catch(() => null) : null
  const gif = GIFEncoder()
  const frames = 20
  const delay = 80
  for (let i = 0; i < frames; i += 1) {
    const t = i / frames
    drawCard(ctx, w, h, o, t, photo)
    const data = ctx.getImageData(0, 0, w, h).data
    const palette = quantize(data, 256, { format: 'rgba4444' })
    const index = applyPalette(data, palette)
    gif.writeFrame(index, w, h, { palette, delay })
  }
  gif.finish()
  const bytes = gif.bytes()
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes as unknown as ArrayLike<number>)
  const blob = new Blob([copy.buffer], { type: 'image/gif' })
  return blob.size > 0 ? { blob, filename: cardFilename(o.forName, 'gif') } : null
}

export async function exportCardVideo(o: CardExportOptions, durationMs = 4200): Promise<ExportResult | null> {
  const w = o.width ?? 576
  const h = o.height ?? Math.round(w * (CARD_H / CARD_W))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  if (typeof MediaRecorder === 'undefined' || !('captureStream' in HTMLCanvasElement.prototype)) return null
  const photo = o.photo ? await loadImage(o.photo).catch(() => null) : null
  const stream = canvas.captureStream(30)
  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm'
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2_500_000 })
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data)
  }
  await new Promise<void>((resolve) => {
    const start = performance.now()
    const frame = () => {
      const t = Math.min(1, (performance.now() - start) / durationMs)
      drawCard(ctx, w, h, o, t, photo)
      if (t < 1) requestAnimationFrame(frame)
      else recorder.stop()
    }
    recorder.onstop = () => resolve()
    recorder.start()
    frame()
  })
  const type = mime.split(';')[0]
  const blob = new Blob(chunks, { type })
  return blob.size > 0 ? { blob, filename: cardFilename(o.forName, type === 'video/webm' ? 'webm' : 'mp4') } : null
}

export function downloadResult(result: ExportResult) {
  const url = URL.createObjectURL(result.blob)
  const a = document.createElement('a')
  a.href = url
  a.download = result.filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}