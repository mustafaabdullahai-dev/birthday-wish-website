import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface Props {
  value: string
  size?: number
}

export function QrCode({ value, size = 220 }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let stale = false
    QRCode.toDataURL(value, { width: size, margin: 2, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (!stale) setDataUrl(url)
      })
      .catch(() => {
        if (!stale) setError(true)
      })
    return () => {
      stale = true
    }
  }, [value, size])

  if (error) return <p className="qr-error">Could not generate QR code.</p>
  if (!dataUrl) return <div className="qr-placeholder" style={{ width: size, height: size }} aria-hidden />
  return <img className="qr-img" src={dataUrl} alt="QR code for this wish link" width={size} height={size} />
}

export function qrDownloadName(forName: string): string {
  const base = forName.trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/(^-|-$)/g, '')
  return base ? `${base}-birthday-wish.png` : 'birthday-wish.png'
}