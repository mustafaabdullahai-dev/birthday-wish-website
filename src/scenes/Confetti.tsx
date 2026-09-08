import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Palette } from '../types'

const COUNT = 260

interface Piece {
  position: THREE.Vector3
  velocity: THREE.Vector3
  rotation: THREE.Euler
  spin: THREE.Vector3
  color: THREE.Color
  swayPhase: number
}

export function Confetti({ palette }: { palette: Palette }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const pieces = useMemo<Piece[]>(() => {
    const colors = [palette.primary, palette.secondary, palette.accent, '#FFD700', '#ff9ff3', '#ffffff']
    return Array.from({ length: COUNT }, (_, i) => {
      const piece: Piece = {
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 40,
          Math.random() * 30 - 5,
          -2 - Math.random() * 14,
        ),
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.4, -1 - Math.random() * 2.4, 0),
        rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
        spin: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3,
        ),
        color: new THREE.Color(colors[i % colors.length]),
        swayPhase: Math.random() * Math.PI * 2,
      }
      return piece
    })
  }, [palette])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const quat = useMemo(() => new THREE.Quaternion(), [])

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const time = state.clock.elapsedTime
    dummy.rotation.set(0, 0, 0)
    for (let i = 0; i < COUNT; i += 1) {
      const p = pieces[i]
      p.velocity.y -= 0.3 * delta
      p.velocity.x = Math.sin(time * 1.4 + p.swayPhase) * 0.18
      p.position.addScaledVector(p.velocity, delta)
      p.rotation.x += p.spin.x * delta
      p.rotation.y += p.spin.y * delta
      p.rotation.z += p.spin.z * delta
      if (p.position.y < -8) {
        p.position.y = 16 + Math.random() * 4
        p.position.x = (Math.random() - 0.5) * 40
      }
      dummy.position.copy(p.position)
      dummy.rotation.copy(p.rotation)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
      meshRef.current.setColorAt(i, p.color)
    }
    quat.identity()
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <boxGeometry args={[0.22, 0.34, 0.03]} />
      <meshStandardMaterial roughness={0.5} metalness={0.1} />
    </instancedMesh>
  )
}