import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Rocket {
  active: boolean
  x: number
  y: number
  z: number
  vy: number
  age: number
}

const MAX_ROCKETS = 5
const SPARK_COUNT = 1500

function makeRocketSet(): Rocket[] {
  return Array.from({ length: MAX_ROCKETS }, () => ({
    active: false,
    x: 0,
    y: 0,
    z: 0,
    vy: 0,
    age: 0,
  }))
}

const hueCache = new Map<number, THREE.Color>()

function hsl(r: number, g: number, b: number): THREE.Color {
  const key = r * 100000 + g * 100 + b
  let c = hueCache.get(key)
  if (!c) {
    c = new THREE.Color().setHSL(r, g, b)
    hueCache.set(key, c)
  }
  return c
}

export function Fireworks() {
  const rockets = useRef<Rocket[]>(makeRocketSet())
  const timer = useRef(0)

  const geometry = useMemo(() => {
    const positions = new Float32Array(SPARK_COUNT * 3)
    positions.fill(1000)
    const colors = new Float32Array(SPARK_COUNT * 3)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [])

  const vel = useMemo(() => new Float32Array(SPARK_COUNT * 3), [])
  const life = useMemo(() => new Float32Array(SPARK_COUNT), [])
  const baseR = useMemo(() => new Float32Array(SPARK_COUNT), [])
  const baseG = useMemo(() => new Float32Array(SPARK_COUNT), [])
  const baseB = useMemo(() => new Float32Array(SPARK_COUNT), [])

  function launchRocket() {
    const rkt = rockets.current.find((r) => !r.active)
    if (!rkt) return
    rkt.active = true
    rkt.x = (Math.random() - 0.5) * 16
    rkt.y = -8 + Math.random() * 3
    rkt.z = -4 - Math.random() * 4
    rkt.vy = 20 + Math.random() * 8
    rkt.age = 0
  }

  function explode(x: number, y: number, z: number) {
    const placed = Math.floor(140 + Math.random() * 120)
    const positions = geometry.attributes.position.array as Float32Array
    let placedCount = 0
    let guard = 0
    while (placedCount < placed && guard < SPARK_COUNT * 4) {
      guard += 1
      const idx = Math.floor(Math.random() * SPARK_COUNT)
      if (life[idx] > 0) continue
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const speed = 5 + Math.random() * 13
      vel[idx * 3] = speed * Math.sin(phi) * Math.cos(theta)
      vel[idx * 3 + 1] = speed * Math.cos(phi) * 1.15 + 3
      vel[idx * 3 + 2] = speed * Math.sin(phi) * Math.sin(theta) * 0.5
      life[idx] = 1
      positions[idx * 3] = x
      positions[idx * 3 + 1] = y
      positions[idx * 3 + 2] = z
      const hue = Math.random() < 0.55 ? 0.11 + Math.random() * 0.06 : Math.random()
      const c = hsl(hue, 0.9, 0.65)
      baseR[idx] = c.r
      baseG[idx] = c.g
      baseB[idx] = c.b
      placedCount += 1
    }
  }

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    timer.current += dt

    if (timer.current > 0.5) {
      timer.current = 0
      launchRocket()
    }

    rockets.current.forEach((rkt) => {
      if (!rkt.active) return
      rkt.y += rkt.vy * dt
      rkt.vy -= 9.8 * dt
      rkt.age += dt
      if (rkt.vy <= 1 || rkt.age > 3.2) {
        rkt.active = false
        explode(rkt.x, rkt.y, rkt.z)
      }
    })

    const positions = geometry.attributes.position.array as Float32Array
    const colors = geometry.attributes.color.array as Float32Array
    for (let i = 0; i < SPARK_COUNT; i += 1) {
      if (life[i] <= 0) {
        positions[i * 3] = 1000
        positions[i * 3 + 1] = 1000
        positions[i * 3 + 2] = 1000
        continue
      }
      life[i] -= dt * 1.4
      vel[i * 3 + 1] -= 10 * dt
      positions[i * 3] += vel[i * 3] * dt
      positions[i * 3 + 1] += vel[i * 3 + 1] * dt
      positions[i * 3 + 2] += vel[i * 3 + 2] * dt
      const v = Math.max(0, life[i])
      colors[i * 3] = baseR[i] * v
      colors[i * 3 + 1] = baseG[i] * v
      colors[i * 3 + 2] = baseB[i] * v
    }
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.color.needsUpdate = true
  })

  return (
    <group>
      {rockets.current.map((r, i) => (
        <RocketMesh key={i} rocket={r} />
      ))}
      <points frustumCulled={false}>
        <primitive object={geometry} attach="geometry" />
        <pointsMaterial
          size={1.7}
          sizeAttenuation
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}

function RocketMesh({ rocket }: { rocket: Rocket }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (ref.current) {
      if (rocket.active) ref.current.position.set(rocket.x, rocket.y, rocket.z)
      else ref.current.position.set(0, -20, -4)
    }
  })
  return (
    <mesh ref={ref} position={[0, -10, -2]}>
      <sphereGeometry args={[0.2, 8, 8]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  )
}