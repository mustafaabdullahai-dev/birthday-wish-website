declare module 'gifenc' {
  export interface GifEncoderOptions {
    auto?: boolean
    initialCapacity?: number
  }

  export interface GifFrameOptions {
    palette?: Uint32Array
    delay?: number
    transparent?: boolean
    transparentIndex?: number
    repeat?: number
    dispose?: number
  }

  export interface GIFEncoderInstance {
    writeFrame(index: Uint8Array | Uint8ClampedArray, width: number, height: number, options?: GifFrameOptions): void
    finish(): void
    bytes(): Uint8Array
    reset?(): void
  }

  export interface QuantizeOptions {
    format?: 'rgb565' | 'rgb444' | 'rgba4444'
    oneBitAlpha?: boolean
    clearAlpha?: boolean
    clearAlphaThreshold?: number
    clearAlphaColor?: number
  }

  export interface PrequantizeOptions {
    format?: 'rgb565' | 'rgb444' | 'rgba4444'
    oneBitAlpha?: boolean
  }

  export function GIFEncoder(options?: GifEncoderOptions): GIFEncoderInstance
  export function quantize(data: Uint8Array | Uint8ClampedArray, maxColors: number, options?: QuantizeOptions): Uint32Array
  export function applyPalette(data: Uint8Array | Uint8ClampedArray, palette: Uint32Array, format?: string): Uint8Array
  export function prequantize(data: Uint8Array | Uint8ClampedArray, options?: PrequantizeOptions): Uint8Array
  export function nearestColorIndex(color: Uint32Array, palette: Uint32Array): number
  export function snapColorsToPalette(data: Uint8Array | Uint8ClampedArray, palette: Uint32Array): Uint8Array
}