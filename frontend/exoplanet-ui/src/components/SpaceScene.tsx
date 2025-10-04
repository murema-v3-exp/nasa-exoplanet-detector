import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'

import * as THREE from 'three'

const SpaceScene: React.FC = () => {
  const ref = useRef<THREE.Points>(null!)
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(2000 * 3)
    for (let i = 0; i < 2000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200
    }
    return positions
  }, [])

  const particlesGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(particlesPosition, 3))
    return geometry
  }, [particlesPosition])

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.02
      ref.current.rotation.y = state.clock.elapsedTime * 0.02
    }
  })

  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      
      {/* Animated particle field */}
      <points ref={ref} geometry={particlesGeometry}>
        <pointsMaterial
          color="#4f46e5"
          size={0.5}
          transparent
          opacity={0.6}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      {/* Central nebula effect */}
      <mesh position={[0, 0, -30]}>
        <sphereGeometry args={[15, 32, 32]} />
        <meshBasicMaterial
          color="#1e1b4b"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Distant galaxy spiral */}
      <mesh position={[50, -20, -80]} rotation={[0.5, 0, 0]}>
        <torusGeometry args={[20, 2, 8, 100]} />
        <meshBasicMaterial
          color="#3730a3"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  )
}

export default SpaceScene