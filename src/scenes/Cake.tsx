import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Palette } from '../types'
import { audio } from '../utils/audioEngine'

interface CakeProps {
  name: string
  palette: Palette
  cakeColor: string
  candlesOut: boolean
  onBlow: () => void
  emerging: boolean
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

export function Cake({ name, palette, cakeColor, candlesOut, onBlow, emerging }: CakeProps) {
  const group = useRef<THREE.Group>(null)
  const candleGlow = useRef<THREE.PointLight>(null)
  const smokeRef = useRef<THREE.Points>(null)
  const emergence = useRef(emerging ? -7 : 0)
  const atTarget = useRef(!emerging)

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
      {/* base plate */}
      <mesh position={[0, -2.45, 0]} receiveShadow>
        <cylinderGeometry args={[4.2, 4.5, 0.5, 48]} />
        <meshStandardMaterial color="#E8D9F0" roughness={0.6} />
      </mesh>

      {/* bottom tier */}
      <mesh position={[0, -0.75, 0]} castShadow>
        <cylinderGeometry args={[3.2, 3.2, 2.4, 48]} />
        <meshStandardMaterial color={cakeColor} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <torusGeometry args={[3.2, 0.18, 12, 48]} />
        <meshStandardMaterial color="#fdeff7" roughness={0.45} />
      </mesh>

      {/* top tier */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[2.1, 2.1, 1.6, 48]} />
        <meshStandardMaterial color={cakeColor} roughness={0.55} />
      </mesh>
      <mesh position={[0, 2.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.35, 2.35, 0.3, 48]} />
        <meshStandardMaterial color="#fdeff7" roughness={0.45} />
      </mesh>

      {/* frosted rim */}
      <mesh position={[0, 2.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.35, 0.14, 12, 48]} />
        <meshStandardMaterial color="#fff3f9" roughness={0.4} />
      </mesh>

      {/* sprinkles */}
      {Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 1.3, 2.52, Math.sin(angle) * 1.3]}
            rotation={[Math.random(), Math.random(), Math.random()]}
          >
            <cylinderGeometry args={[0.045, 0.045, 0.2, 6]} />
            <meshStandardMaterial color={SPRINKLE_COLORS[i % 5]} roughness={0.3} />
          </mesh>
        )
      })}

      {/* name icing on the front */}
      <mesh position={[0, 1.15, 2.04]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[5.4, 2.2]} />
        <meshBasicMaterial map={icingTexture} transparent depthWrite={false} />
      </mesh>

      {/* candles */}
      {Array.from({ length: candleCount }, (_, i) => (
        <Candle key={i} index={i} total={candleCount} lit={!candlesOut} />
      ))}

      {/* candle glow light */}
      <pointLight
        ref={candleGlow}
        position={[0, 3.4, 0]}
        color="#FFB347"
        distance={14}
        intensity={candlesOut ? 0 : 1.6}
      />

      {/* smoke particles */}
      <points ref={smokeRef} frustumCulled={false}>
        <primitive object={smokeGeometry} attach="geometry" />
        <pointsMaterial
          size={0.001}
          color="#e8e8e8"
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  )
}

function Candle({
  index,
  total,
  lit,
}: {
  index: number
  total: number
  lit: boolean
}) {
  const flame = useRef<THREE.Mesh>(null)

  const angle = (index / total) * Math.PI * 2 - Math.PI / 2
  const radius = 1.35
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
    <group position={[x, 2.28, z]} rotation={[0, -angle + Math.PI / 2, 0]}>
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