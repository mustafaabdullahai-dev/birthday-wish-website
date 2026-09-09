import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Palette, CakeStyle } from '../types'
import { audio } from '../utils/audioEngine'

interface CakeProps {
  name: string
  palette: Palette
  cakeColor: string
  candlesOut: boolean
  onBlow: () => void
  emerging: boolean
  style?: CakeStyle
}

function makeIcingTexture(name: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  const tint = ctx.createLinearGradient(0, 0, 1024, 512)
  tint.addColorStop(0, 'rgba(253, 225, 240, 0.9)')
  tint.addColorStop(1, 'rgba(224, 242, 253, 0.9)')
  ctx.fillStyle = tint
  ctx.fillRect(0, 0, 1024, 512)

  const cursive = ctx.createLinearGradient(120, 0, 920, 0)
  cursive.addColorStop(0, color)
  cursive.addColorStop(0.5, '#E91E63')
  cursive.addColorStop(1, color)
  ctx.shadowColor = 'rgba(0,0,0,0.25)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 4
  ctx.font = 'italic 900 128px Georgia, "Times New Roman", serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = cursive
  const text = name.trim().toUpperCase()
  ctx.fillText(text.length > 12 ? text.slice(0, 12) : text, 512, 256)
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0

  ctx.fillStyle = color
  for (let x = 40; x < 1024; x += 48) {
    ctx.beginPath()
    ctx.arc(x, 32, 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x + 24, 480, 12, 0, Math.PI * 2)
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.anisotropy = 4
  return tex
}

const FLAME_COLORS = ['#FFD700', '#FFA500', '#FF6B35', '#FFD700', '#FFB347', '#FFA500']
const SPRINKLE_COLORS = ['#FF6B6B', '#FFD93D', '#4ECDC4', '#9B5DE5', '#F15BB5']

interface TierSpec {
  kind: 'cyl' | 'box'
  a: number
  y: number
  h: number
  flat?: boolean
}

interface RimSpec {
  kind: 'torus' | 'cyl' | 'boxLip'
  a: number
  y: number
  h?: number
  flat?: boolean
}

interface CakeLayout {
  tiers: TierSpec[]
  rims: RimSpec[]
  sprinkles: { y: number; radius: number }
  candles: { y: number; radius: number }
  name: { x: number; y: number; z: number; rotX: number; size: [number, number] }
  centerCake?: { y: number; r: number }
}

function cakeLayout(style: CakeStyle): CakeLayout {
  switch (style) {
    case 'tiered':
      return {
        tiers: [
          { kind: 'cyl', a: 3.5, y: -1.55, h: 1.15 },
          { kind: 'cyl', a: 2.6, y: -0.45, h: 1.05 },
          { kind: 'cyl', a: 1.8, y: 0.6, h: 0.95 },
        ],
        rims: [{ kind: 'torus', a: 1.8, y: 1.08 }],
        sprinkles: { y: 1.32, radius: 0.9 },
        candles: { y: 1.12, radius: 0.95 },
        name: { x: 0, y: -0.45, z: 2.72, rotX: 0, size: [5.0, 2.1] },
      }
    case 'square':
      return {
        tiers: [
          { kind: 'box', a: 3.7, y: -1.0, h: 1.7 },
          { kind: 'box', a: 2.5, y: 0.5, h: 1.3 },
        ],
        rims: [
          { kind: 'boxLip', a: 2.7, y: 1.15, h: 0.12 },
          { kind: 'boxLip', a: 3.9, y: -0.12, h: 0.12 },
        ],
        sprinkles: { y: 1.4, radius: 0.75 },
        candles: { y: 1.26, radius: 0.85 },
        name: { x: 0, y: 0.5, z: 1.28, rotX: 0, size: [4.5, 1.9] },
      }
    case 'ring':
      return {
        tiers: [{ kind: 'box', a: 0.001, y: 0, h: 0.001 }],
        rims: [],
        sprinkles: { y: -0.35, radius: 2.0 },
        candles: { y: -0.42, radius: 2.0 },
        name: { x: 0, y: -1.3, z: 3.1, rotX: 0, size: [5.0, 2.0] },
        centerCake: { y: -1.5, r: 2.2 },
      }
    case 'classic':
    default:
      return {
        tiers: [
          { kind: 'cyl', a: 3.2, y: -0.75, h: 2.4 },
          { kind: 'cyl', a: 2.1, y: 1.3, h: 1.6 },
        ],
        rims: [
          { kind: 'torus', a: 3.2, y: 0.55 },
          { kind: 'cyl', a: 2.35, y: 2.1, h: 0.3, flat: true },
          { kind: 'torus', a: 2.35, y: 2.24 },
        ],
        sprinkles: { y: 2.52, radius: 1.3 },
        candles: { y: 2.28, radius: 1.35 },
        name: { x: 0, y: 1.15, z: 2.04, rotX: Math.PI, size: [5.4, 2.2] },
      }
  }
}

export function Cake({ name, palette, cakeColor, candlesOut, onBlow, emerging, style = 'classic' }: CakeProps) {
  const group = useRef<THREE.Group>(null)
  const candleGlow = useRef<THREE.PointLight>(null)
  const smokeRef = useRef<THREE.Points>(null)
  const emergence = useRef(emerging ? -7 : 0)
  const atTarget = useRef(!emerging)

  const layout = useMemo(() => cakeLayout(style), [style])

  const smokeGeometry = useMemo(() => {
    const smokeCount = 240
    const pos = new Float32Array(smokeCount * 3)
    const vel = new Float32Array(smokeCount * 3)
    const seed = new Float32Array(smokeCount)
    for (let i = 0; i < smokeCount; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * 2.5
      pos[i * 3 + 1] = 2.3 + Math.random() * 0.4
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.5
      vel[i * 3 + 1] = 2 + Math.random() * 4
      seed[i] = Math.random() * 3
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.userData = { vel, seed }
    return geo
  }, [])

  const icingTexture = useMemo(() => makeIcingTexture(name, palette.primary), [name, palette])
  const candleCount = useMemo(() => Math.min(6, Math.max(1, name.length % 5 + 1)), [name])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)

    if (!emerging) {
      emergence.current = 0
      atTarget.current = true
    } else if (!atTarget.current) {
      emergence.current += dt * 5
      if (emergence.current >= 0) {
        emergence.current = 0
        atTarget.current = true
        audio.whoosh()
      }
    }

    if (group.current) {
      group.current.position.y = emergence.current
      group.current.rotation.y += dt * 0.4
    }

    if (candleGlow.current) {
      const flick = candlesOut
        ? 0
        : 0.7 + Math.sin(state.clock.elapsedTime * 18) * 0.4 + Math.sin(state.clock.elapsedTime * 31) * 0.25
      candleGlow.current.intensity = flick
    }

    if (smokeRef.current) {
      const geo = smokeRef.current.geometry as THREE.BufferGeometry
      const attr = geo.getAttribute('position') as THREE.BufferAttribute
      const arr = attr.array as Float32Array
      const u = geo.userData as { vel: Float32Array; seed: Float32Array }
      const n = arr.length / 3
      for (let i = 0; i < n; i += 1) {
        u.vel[i * 3 + 1] *= 1 - dt * 0.02
        arr[i * 3 + 1] += u.vel[i * 3 + 1] * dt
        arr[i * 3] += Math.sin(state.clock.elapsedTime + u.seed[i]) * dt * 0.3
        if (arr[i * 3 + 1] > 6) {
          arr[i * 3] = (Math.random() - 0.5) * 2.5
          arr[i * 3 + 1] = 2.3
          arr[i * 3 + 2] = (Math.random() - 0.5) * 2.5
          u.vel[i * 3 + 1] = 2 + Math.random() * 4
        }
      }
      attr.needsUpdate = true
      const mat = smokeRef.current.material as THREE.PointsMaterial
      mat.size = candlesOut ? 0.55 : 0.001
    }
  })

  const handleCakeClick = () => {
    if (candlesOut || !atTarget.current) return
    audio.hiss()
    onBlow()
  }

  return (
    <group ref={group} position={[0, 0, 0]} onClick={handleCakeClick}>
      <mesh position={[0, -2.45, 0]} receiveShadow>
        <cylinderGeometry args={[4.2, 4.5, 0.5, 48]} />
        <meshStandardMaterial color="#E8D9F0" roughness={0.6} />
      </mesh>

      {style === 'ring' && layout.centerCake && (
        <mesh position={[0, layout.centerCake.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[layout.centerCake.r, 0.62, 24, 64]} />
          <meshStandardMaterial color={cakeColor} roughness={0.5} />
        </mesh>
      )}

      {layout.tiers
        .filter((t) => t.a > 0.01)
        .map((t, i) => (
          <mesh key={`tier${i}`} position={[0, t.y, 0]} castShadow>
            {t.kind === 'box' ? (
              <boxGeometry args={[t.a, t.h, t.a]} />
            ) : (
              <cylinderGeometry args={[t.a, t.a, t.h, 48]} />
            )}
            <meshStandardMaterial color={cakeColor} roughness={0.55} />
          </mesh>
        ))}

      {layout.rims.map((r, i) =>
        r.kind === 'torus' ? (
          <mesh key={`rim${i}`} position={[0, r.y, 0]} castShadow>
            <torusGeometry args={[r.a, 0.14, 12, 48]} />
            <meshStandardMaterial color="#fdeff7" roughness={0.45} />
          </mesh>
        ) : r.kind === 'boxLip' ? (
          <mesh key={`rim${i}`} position={[0, r.y, 0]} castShadow>
            <boxGeometry args={[r.a, r.h ?? 0.12, r.a]} />
            <meshStandardMaterial color="#fdeff7" roughness={0.45} />
          </mesh>
        ) : (
          <mesh key={`rim${i}`} position={[0, r.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[r.a, r.a, r.h ?? 0.3, 48]} />
            <meshStandardMaterial color="#fdeff7" roughness={0.45} />
          </mesh>
        ),
      )}

      {Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * layout.sprinkles.radius, layout.sprinkles.y, Math.sin(angle) * layout.sprinkles.radius]}
            rotation={[Math.random(), Math.random(), Math.random()]}
          >
            <cylinderGeometry args={[0.045, 0.045, 0.2, 6]} />
            <meshStandardMaterial color={SPRINKLE_COLORS[i % 5]} roughness={0.3} />
          </mesh>
        )
      })}

      <mesh position={[layout.name.x, layout.name.y, layout.name.z]} rotation={[layout.name.rotX, Math.PI, 0]}>
        <planeGeometry args={layout.name.size} />
        <meshBasicMaterial map={icingTexture} transparent depthWrite={false} />
      </mesh>

      {Array.from({ length: candleCount }, (_, i) => (
        <Candle key={i} index={i} total={candleCount} lit={!candlesOut} radius={layout.candles.radius} y={layout.candles.y} />
      ))}

      <pointLight ref={candleGlow} position={[0, 3.4, 0]} color="#FFB347" distance={14} intensity={candlesOut ? 0 : 1.6} />

      <points ref={smokeRef} frustumCulled={false}>
        <primitive object={smokeGeometry} attach="geometry" />
        <pointsMaterial size={0.001} color="#e8e8e8" transparent opacity={0.9} sizeAttenuation depthWrite={false} />
      </points>
    </group>
  )
}

function Candle({ index, total, lit, radius, y }: { index: number; total: number; lit: boolean; radius: number; y: number }) {
  const flame = useRef<THREE.Mesh>(null)

  const angle = (index / total) * Math.PI * 2 - Math.PI / 2
  const x = Math.cos(angle) * radius
  const z = Math.sin(angle) * radius
  const hue = FLAME_COLORS[index % FLAME_COLORS.length]

  useFrame((state) => {
    if (!flame.current) return
    if (!lit) {
      const s = Math.max(0.001, flame.current.scale.y - 0.1)
      flame.current.scale.set(s, s, s)
      return
    }
    const t = state.clock.elapsedTime * (14 + index * 1.7)
    const s = 1 + Math.sin(t) * 0.35 + Math.sin(t * 1.7 + index) * 0.2
    flame.current.scale.set(s, s * 1.2, s)
  })

  return (
    <group position={[x, y, z]} rotation={[0, -angle + Math.PI / 2, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.85, 12]} />
        <meshStandardMaterial
          color={['#ffffff', '#ffc9c9', '#bdefff'][index % 3]}
          emissive="#774444"
          emissiveIntensity={0.3}
          roughness={0.4}
        />
      </mesh>
      <mesh ref={flame} position={[0, 0.64, 0]}>
        <sphereGeometry args={[0.115, 8, 8]} />
        <meshBasicMaterial color={lit ? hue : '#3c3c3c'} transparent opacity={0.95} />
      </mesh>
    </group>
  )
}