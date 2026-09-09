import { useRef, useMemo, useCallback, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { BalloonStyle } from '../types'
import { audio } from '../utils/audioEngine'

interface BalloonData {
  id: number
  x: number
  speed: number
  amplitude: number
  phase: number
  scale: number
  color: string
}

const BALLOON_SETS: Record<BalloonStyle, string[]> = {
  classic: ['#FF6B6B', '#4ECDC4', '#FFD93D', '#FF9F1C', '#9B5DE5', '#F15BB5', '#00BBF9', '#00F5D4'],
  pastel: ['#FFC2D1', '#B8E0D2', '#F7E7CE', '#CBAACB', '#FADADD', '#A2D2FF', '#FDE2E4', '#DDB9A3'],
  neon: ['#FF1493', '#00FFFF', '#39FF14', '#FDFF00', '#FF7500', '#B026FF', '#7DF9FF', '#FF3B30'],
  gold: ['#FFD700', '#FFB347', '#FFC300', '#E5B80B', '#F9E076', '#D4AF37', '#FFE066', '#F3B431'],
  silver: ['#B8E0D2', '#98D0C4', '#E0F7FA', '#A8E6CF', '#7FB6A8', '#D3F8FF', '#91C9E8', '#C4E6F5'],
}

function ColorFor(style: BalloonStyle, i: number): string {
  const set = BALLOON_SETS[style] ?? BALLOON_SETS.classic
  return set[i % set.length]
}

function makeBalloon(i: number, style: BalloonStyle): BalloonData {
  return {
    id: i,
    x: (Math.random() - 0.5) * 26,
    speed: 1.2 + Math.random() * 2.2,
    amplitude: 0.8 + Math.random() * 1.4,
    phase: Math.random() * Math.PI * 2,
    scale: 0.7 + Math.random() * 0.7,
    color: ColorFor(style, i),
  }
}

function Balloon({ data }: { data: BalloonData }) {
  const group = useRef<THREE.Group>(null)
  const body = useRef<THREE.Mesh>(null)
  const y = useRef(-9 + Math.random() * -2)
  const [dead, setDead] = useState(false)

  const handleClick = useCallback(() => {
    if (dead) return
    audio.pop()
    setDead(true)
  }, [dead])

  useFrame((_, delta) => {
    if (!group.current || dead) return
    y.current += data.speed * delta
    if (y.current > 14) y.current = -9
    group.current.position.y = y.current
    group.current.position.x = data.x + Math.sin(y.current * 0.6 + data.phase) * data.amplitude
    if (body.current) {
      body.current.rotation.y += delta * 0.6
      body.current.rotation.z = Math.sin(y.current * 2 + data.phase) * 0.25
      body.current.scale.setScalar(1 + Math.sin(y.current * 2.5 + data.phase) * 0.05)
    }
  })

  if (dead) {
    return <PopBurst position={[data.x, y.current, -1]} color={data.color} />
  }

  return (
    <group ref={group} position={[data.x, y.current, -1]}>
      <mesh ref={body} onClick={handleClick} castShadow>
        <sphereGeometry args={[0.9 * data.scale, 14, 14]} />
        <meshStandardMaterial color={data.color} transparent opacity={0.92} roughness={0.3} metalness={0.05} />
      </mesh>
      <mesh position={[0, -0.95 * data.scale, 0]}>
        <coneGeometry args={[0.2 * data.scale, 0.45 * data.scale, 8]} />
        <meshStandardMaterial color={data.color} roughness={0.4} />
      </mesh>
      <mesh position={[0, -1.5 * data.scale, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 1.1 * data.scale, 4]} />
        <meshBasicMaterial color="#e0d8ff" transparent opacity={0.45} />
      </mesh>
    </group>
  )
}

function PopBurst({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Points>(null)
  const geometry = useMemo(() => {
    const n = 32
    const pos = new Float32Array(n * 3)
    const velArr = new Float32Array(n * 3)
    for (let i = 0; i < n; i += 1) {
      const theta = (i / n) * Math.PI * 2
      const speed = 2 + Math.random() * 3
      velArr[i * 3] = Math.cos(theta) * speed
      velArr[i * 3 + 1] = Math.sin(theta) * speed + 1.5
      velArr[i * 3 + 2] = (Math.random() - 0.5) * 2
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.userData = velArr
    return g
  }, [])

  useFrame((_, delta) => {
    if (!ref.current) return
    const attr = ref.current.geometry.getAttribute('position') as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    const vel = ref.current.geometry.userData as Float32Array
    for (let i = 0; i < arr.length / 3; i += 1) {
      arr[i * 3] += vel[i * 3] * delta
      arr[i * 3 + 1] += vel[i * 3 + 1] * delta
      vel[i * 3 + 1] -= 6 * delta
      arr[i * 3 + 2] += vel[i * 3 + 2] * delta
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={ref} position={position} frustumCulled={false}>
      <primitive object={geometry} attach="geometry" />
      <pointsMaterial size={0.32} color={color} transparent depthWrite={false} />
    </points>
  )
}

export function Balloons({ count = 12, style = 'classic' }: { count?: number; style?: BalloonStyle }) {
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <Balloon key={i} data={makeBalloon(i, style)} />
      ))}
    </group>
  )
}