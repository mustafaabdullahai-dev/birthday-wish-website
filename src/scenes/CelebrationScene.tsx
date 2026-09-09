import { Suspense, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Palette } from '../types'
import { Fireworks } from './Fireworks'
import { Balloons } from './Balloons'
import { Confetti } from './Confetti'
import { Cake } from './Cake'

interface SceneProps {
  name: string
  palette: Palette
  cakeColor: string
  candlesOut: boolean
  cakeEmerging: boolean
  onBlow: () => void
  activePhase?: 'idle' | 'active'
}

function getQualityTier(): { dprMax: number; isLowEnd: boolean } {
  const isMobile = /Mobi|Android/i.test(navigator.userAgent)
  const cores = navigator.hardwareConcurrency ?? 4
  if (cores <= 4 || isMobile) {
    return { dprMax: 1.5, isLowEnd: true }
  }
  return { dprMax: 2, isLowEnd: false }
}

function Rig() {
  const target = useRef({ x: 0, y: 1.6, z: 14 })
  useFrame(({ camera }) => {
    camera.position.lerp(target.current, 0.05)
    camera.lookAt(0, 1.2, 0)
  })
  return null
}

function Ground() {
  const mesh = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!mesh.current) return
    const mat = mesh.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.15 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05
  })
  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.5, 0]} receiveShadow>
      <circleGeometry args={[60, 64]} />
      <meshStandardMaterial color="#0c0a1e" emissive="#2a1440" emissiveIntensity={0.35} roughness={0.8} />
    </mesh>
  )
}

function StageLights() {
  const light = useRef<THREE.SpotLight>(null)
  useFrame((state) => {
    if (!light.current) return
    const t = state.clock.elapsedTime
    light.current.position.x = Math.sin(t * 0.4) * 6
    light.current.position.z = Math.cos(t * 0.3) * 6
  })
  return (
    <>
      <ambientLight intensity={0.45} />
      <spotLight ref={light} position={[4, 9, 4]} angle={0.6} penumbra={0.8} intensity={260} color="#ffffff" castShadow />
      <directionalLight position={[-6, 8, -4]} intensity={0.8} color="#b09bff" />
      <pointLight position={[0, -2, 6]} intensity={12} color="#ff9ff3" />
    </>
  )
}

export function CelebrationScene({
  name,
  palette,
  cakeColor,
  candlesOut,
  cakeEmerging,
  onBlow,
  activePhase = 'active',
}: SceneProps) {
  const { dprMax, isLowEnd } = useMemo(() => getQualityTier(), [])
  const balloonCount = isLowEnd ? 6 : 12

  return (
    <Canvas
      shadows={!isLowEnd}
      dpr={[1, dprMax]}
      frameloop={activePhase === 'idle' ? 'demand' : 'always'}
      gl={{ antialias: !isLowEnd, alpha: true }}
      camera={{ position: [0, 1.6, 14], fov: 55 }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <color attach="background" args={[palette.background[0] / 255, palette.background[1] / 255, palette.background[2] / 255]} />
      <fog attach="fog" args={['#0c0a20', 20, 42]} />
      <Suspense fallback={null}>
        <Rig />
        <StageLights />
        <Ground />
        <Fireworks />
        <Balloons count={balloonCount} />
        <Confetti palette={palette} />
        <Cake
          name={name}
          palette={palette}
          cakeColor={cakeColor}
          candlesOut={candlesOut}
          onBlow={onBlow}
          emerging={cakeEmerging}
        />
      </Suspense>
    </Canvas>
  )
}