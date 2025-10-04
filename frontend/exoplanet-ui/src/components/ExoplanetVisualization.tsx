import React, { useState, useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Stars, Line } from '@react-three/drei'
import { Orbit, Target, Info, RotateCcw, Play, Pause } from 'lucide-react'
import * as THREE from 'three'
import './ExoplanetVisualization.css'

interface ExoplanetData {
  id: string
  name: string
  host_star: string
  orbital_period: number
  planet_radius: number
  stellar_radius: number
  distance_from_earth: number
  discovery_method: string
  discovery_year: number
  equilibrium_temperature: number
}

interface ExoplanetVisualizationProps {
  planets: ExoplanetData[]
}

// Animated Planet Component
const Planet: React.FC<{
  data: ExoplanetData
  position: [number, number, number]
  onClick: (planet: ExoplanetData) => void
  isSelected: boolean
  orbitalSpeed: number
}> = ({ data, position, onClick, isSelected, orbitalSpeed }) => {
  const meshRef = useRef<THREE.Mesh>(null!)
  const orbitRef = useRef<THREE.Group>(null!)
  
  const planetColor = useMemo(() => {
    const temp = data.equilibrium_temperature
    if (temp < 200) return '#4f46e5' // Cold - blue
    if (temp < 400) return '#0891b2' // Cool - cyan
    if (temp < 600) return '#059669' // Moderate - green
    if (temp < 800) return '#d97706' // Warm - orange
    return '#dc2626' // Hot - red
  }, [data.equilibrium_temperature])

  const planetScale = Math.log(data.planet_radius + 1) * 0.3 + 0.1

  useFrame((state) => {
    if (orbitRef.current && orbitalSpeed > 0) {
      orbitRef.current.rotation.y += orbitalSpeed * 0.01
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01
      if (isSelected) {
        meshRef.current.scale.setScalar(planetScale * (1 + Math.sin(state.clock.elapsedTime * 3) * 0.1))
      } else {
        meshRef.current.scale.setScalar(planetScale)
      }
    }
  })

  return (
    <group ref={orbitRef}>
      <mesh
        ref={meshRef}
        position={position}
        onClick={() => onClick(data)}
        scale={planetScale}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={planetColor}
          emissive={planetColor}
          emissiveIntensity={isSelected ? 0.3 : 0.1}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {isSelected && (
        <mesh position={position}>
          <ringGeometry args={[planetScale * 1.5, planetScale * 1.8, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}

// Central Star Component
const CentralStar: React.FC<{ radius: number }> = ({ radius }) => {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005
      const intensity = 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.2
      meshRef.current.scale.setScalar(radius * intensity)
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.8} />
      <pointLight intensity={2} distance={50} />
    </mesh>
  )
}

// Orbital Path Component
const OrbitalPath: React.FC<{ radius: number; opacity?: number }> = ({ radius, opacity = 0.3 }) => {
  const points = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, 2 * Math.PI, false, 0)
    const points3D = curve.getPoints(64).map(p => new THREE.Vector3(p.x, 0, p.y))
    return points3D
  }, [radius])

  return (
    <Line
      points={points}
      color="#64748b"
      lineWidth={1}
      transparent
      opacity={opacity}
    />
  )
}

// Main 3D Scene
const ExoplanetScene: React.FC<{
  planets: ExoplanetData[]
  selectedPlanet: string | null
  onPlanetSelect: (planet: ExoplanetData) => void
  isAnimated: boolean
}> = ({ planets, selectedPlanet, onPlanetSelect, isAnimated }) => {
  const { camera } = useThree()
  
  useEffect(() => {
    camera.position.set(15, 15, 15)
    camera.lookAt(0, 0, 0)
  }, [camera])

  const systemData = useMemo(() => {
    return planets.slice(0, 8).map((planet, index) => {
      const orbitalRadius = 3 + index * 1.8
      const angle = (index / planets.length) * Math.PI * 2
      return {
        planet,
        orbitalRadius,
        position: [
          Math.cos(angle) * orbitalRadius,
          0,
          Math.sin(angle) * orbitalRadius
        ] as [number, number, number],
        orbitalSpeed: isAnimated ? 1 / Math.sqrt(orbitalRadius) : 0
      }
    })
  }, [planets, isAnimated])

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[20, 20, 20]} intensity={1} />
      
      <Stars radius={300} depth={50} count={2000} factor={4} saturation={0} fade />
      
      <CentralStar radius={0.8} />
      
      {systemData.map(({ planet, orbitalRadius, position, orbitalSpeed }) => (
        <React.Fragment key={planet.id}>
          <OrbitalPath radius={orbitalRadius} />
          <Planet
            data={planet}
            position={position}
            onClick={onPlanetSelect}
            isSelected={selectedPlanet === planet.id}
            orbitalSpeed={orbitalSpeed}
          />
        </React.Fragment>
      ))}
      
      <Text
        position={[0, 18, 0]}
        fontSize={1.2}
        color="#e2e8f0"
        anchorX="center"
        anchorY="middle"
      >
        Exoplanet System Visualization
      </Text>
      
      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
      />
    </>
  )
}

const ExoplanetVisualization: React.FC<ExoplanetVisualizationProps> = ({ planets }) => {
  const [selectedPlanet, setSelectedPlanet] = useState<ExoplanetData | null>(null)
  const [isAnimated, setIsAnimated] = useState(true)


  const handlePlanetSelect = (planet: ExoplanetData) => {
    setSelectedPlanet(planet)
  }

  const resetView = () => {
    setSelectedPlanet(null)
  }

  return (
    <div className="exoplanet-visualization">
      <div className="visualization-header">
        <div className="visualization-title">
          <Orbit className="title-icon" size={24} />
          <h2>Exoplanet Systems</h2>
          <span className="planet-count">{planets.length} planets</span>
        </div>
        
        <div className="visualization-controls">
          <button
            className={`animation-toggle ${isAnimated ? 'active' : ''}`}
            onClick={() => setIsAnimated(!isAnimated)}
          >
            {isAnimated ? <Pause size={16} /> : <Play size={16} />}
            {isAnimated ? 'Pause' : 'Play'}
          </button>
          
          <button className="reset-btn" onClick={resetView}>
            <RotateCcw size={16} />
            Reset View
          </button>
        </div>
      </div>

      <div className="visualization-content">
        <div className="canvas-container">
          <Canvas camera={{ position: [15, 15, 15], fov: 60 }}>
            <ExoplanetScene
              planets={planets}
              selectedPlanet={selectedPlanet?.id || null}
              onPlanetSelect={handlePlanetSelect}
              isAnimated={isAnimated}
            />
          </Canvas>
        </div>
        
        {selectedPlanet && (
          <div className="planet-info-panel">
            <div className="planet-info-header">
              <Target size={20} />
              <h3>{selectedPlanet.name}</h3>
            </div>
            
            <div className="planet-details">
              <div className="detail-group">
                <h4>Orbital Characteristics</h4>
                <div className="detail-item">
                  <span>Period:</span>
                  <span>{selectedPlanet.orbital_period.toFixed(2)} days</span>
                </div>
                <div className="detail-item">
                  <span>Host Star:</span>
                  <span>{selectedPlanet.host_star}</span>
                </div>
              </div>
              
              <div className="detail-group">
                <h4>Physical Properties</h4>
                <div className="detail-item">
                  <span>Radius:</span>
                  <span>{selectedPlanet.planet_radius.toFixed(2)} R⊕</span>
                </div>
                <div className="detail-item">
                  <span>Temperature:</span>
                  <span>{selectedPlanet.equilibrium_temperature.toFixed(0)} K</span>
                </div>
              </div>
              
              <div className="detail-group">
                <h4>Discovery Info</h4>
                <div className="detail-item">
                  <span>Method:</span>
                  <span>{selectedPlanet.discovery_method}</span>
                </div>
                <div className="detail-item">
                  <span>Year:</span>
                  <span>{selectedPlanet.discovery_year}</span>
                </div>
                <div className="detail-item">
                  <span>Distance:</span>
                  <span>{selectedPlanet.distance_from_earth.toFixed(1)} ly</span>
                </div>
              </div>
            </div>
            
            <div className="temperature-indicator">
              <div className="temp-bar">
                <div 
                  className="temp-fill"
                  style={{
                    width: `${Math.min((selectedPlanet.equilibrium_temperature / 1000) * 100, 100)}%`,
                    backgroundColor: selectedPlanet.equilibrium_temperature < 200 ? '#4f46e5' :
                                   selectedPlanet.equilibrium_temperature < 400 ? '#0891b2' :
                                   selectedPlanet.equilibrium_temperature < 600 ? '#059669' :
                                   selectedPlanet.equilibrium_temperature < 800 ? '#d97706' : '#dc2626'
                  }}
                ></div>
              </div>
              <span className="temp-label">
                {selectedPlanet.equilibrium_temperature < 200 ? 'Very Cold' :
                 selectedPlanet.equilibrium_temperature < 400 ? 'Cold' :
                 selectedPlanet.equilibrium_temperature < 600 ? 'Moderate' :
                 selectedPlanet.equilibrium_temperature < 800 ? 'Hot' : 'Very Hot'}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {!selectedPlanet && (
        <div className="help-overlay">
          <Info size={16} />
          <span>Click on any planet to view detailed information</span>
        </div>
      )}
    </div>
  )
}

export default ExoplanetVisualization