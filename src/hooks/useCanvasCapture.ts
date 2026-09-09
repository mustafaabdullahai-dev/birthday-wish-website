import { useRef, useState, useCallback } from 'react'

export function useCanvasCapture(getCanvas: () => HTMLCanvasElement | null) {
  const [recording, setRecording] = useState(false)
  const supported = Boolean(
    typeof window !== 'undefined' &&
      typeof MediaRecorder !== 'undefined' &&
      typeof HTMLCanvasElement !== 'undefined' &&
      'captureStream' in HTMLCanvasElement.prototype,
  )
  const chunksRef = useRef<Blob[]>([])
  const recorderRef = useRef<MediaRecorder | null>(null)

  const capture = useCallback(
    async (durationMs = 5000): Promise<Blob | null> => {
      const canvas = getCanvas()
      if (!canvas || !supported) return null
      try {
        const stream = canvas.captureStream(30)
        const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm'
        const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 })
        chunksRef.current = []
        recorderRef.current = recorder
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
        }
        recorder.start()
        setRecording(true)
        await new Promise<void>((resolve) => setTimeout(resolve, durationMs))
        recorder.stop()
        await new Promise<void>((resolve) => {
          recorder.onstop = () => resolve()
        })
        setRecording(false)
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        return blob.size > 0 ? blob : null
      } catch {
        setRecording(false)
        return null
      }
    },
    [getCanvas, supported],
  )

  const captureAndDownload = useCallback(
    async (durationMs = 5000) => {
      const blob = await capture(durationMs)
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `celebrate-${Date.now()}.webm`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    },
    [capture],
  )

  return { capture, captureAndDownload, recording, supported }
}
