import React, { useState, useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Stars, Line } from '@react-three/drei'
import { Orbit, Target, Info, RotateCcw, Play, Pause, Zap, Thermometer, Calendar, Map, Telescope, ChevronDown, Globe, Layers, X } from 'lucide-react'
import * as THREE from 'three'
import type { ExoplanetData } from '../services/api'
import './ExoplanetVisualization.css'

interface StarSystem {
  id: string
  name: string
  planets: ExoplanetData[]
  planetCount: number
  position: [number, number, number]
  averageDistance: number
}

interface ExoplanetVisualizationProps {
  planets: ExoplanetData[]
  isSampleData?: boolean
}

type ViewMode = 'galaxy' | 'system'

// Galaxy Star System Component
const GalaxyStarSystem: React.FC<{
  system: StarSystem
  onClick: (system: StarSystem) => void
  isSelected: boolean
}> = ({ system, onClick, isSelected }) => {
  const meshRef = useRef<THREE.Mesh>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)
  
  // Size based on planet count (logarithmic scaling)
  const systemSize = Math.log(system.planetCount + 1) * 0.3 + 0.2
  
  // Color based on average distance
  const systemColor = useMemo(() => {
    const dist = system.averageDistance
    if (dist < 500) return '#00d4ff'   // Close - cyan
    if (dist < 1000) return '#7c3aed'  // Medium - purple  
    if (dist < 2000) return '#ff0080'  // Far - magenta
    return '#fbbf24'                   // Very far - orange
  }, [system.averageDistance])

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1
      meshRef.current.scale.setScalar(systemSize * pulse)
    }
    if (glowRef.current) {
      glowRef.current.rotation.y -= 0.003
      const glowPulse = 1 + Math.sin(state.clock.elapsedTime * 1.5 + Math.PI) * 0.15
      glowRef.current.scale.setScalar(systemSize * 2 * glowPulse)
    }
  })

  return (
    <group position={system.position} onClick={() => onClick(system)}>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial 
          color={systemColor}
          emissive={systemColor}
          emissiveIntensity={0.2}
          transparent
          opacity={isSelected ? 0.4 : 0.2}
        />
      </mesh>
      
      {/* Main star system */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
          color={systemColor}
          emissive={systemColor}
          emissiveIntensity={isSelected ? 0.8 : 0.5}
        />
      </mesh>
      
      {/* System label */}
      <Text
        position={[0, systemSize + 0.8, 0]}
        fontSize={0.3}
        color={systemColor}
        anchorX="center"
        anchorY="bottom"
      >
        {system.name}
      </Text>
      
      {/* Planet count indicator */}
      <Text
        position={[0, systemSize + 0.4, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="bottom"
      >
        {system.planetCount} planets
      </Text>
    </group>
  )
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
    const temp = data.equilibrium_temperature ?? 0
    if (temp < 200) return '#4f46e5' // Cold - blue
    if (temp < 400) return '#0891b2' // Cool - cyan
    if (temp < 600) return '#059669' // Moderate - green
    if (temp < 800) return '#d97706' // Warm - orange
    return '#dc2626' // Hot - red
  }, [data.equilibrium_temperature])

  // Better planet scaling - smaller and more consistent
  const planetScale = Math.min(Math.log((data.planet_radius ?? 1) + 1) * 0.15 + 0.08, 0.4)

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
          emissiveIntensity={isSelected ? 0.4 : 0.2}
        />
      </mesh>
      
      {isSelected && (
        <>
          <mesh position={position}>
            <ringGeometry args={[planetScale * 1.8, planetScale * 2.2, 32]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={position}>
            <ringGeometry args={[planetScale * 2.4, planetScale * 2.6, 32]} />
            <meshBasicMaterial color="#60a5fa" transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
    </group>
  )
}

// Central Star Component
const CentralStar: React.FC<{ radius: number }> = ({ radius }) => {
  const meshRef = useRef<THREE.Mesh>(null!)
  const coronaRef = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01
      const intensity = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.15
      meshRef.current.scale.setScalar(radius * intensity)
    }
    if (coronaRef.current) {
      coronaRef.current.rotation.y -= 0.005
      const coronaIntensity = 1 + Math.sin(state.clock.elapsedTime * 1.5 + Math.PI) * 0.1
      coronaRef.current.scale.setScalar(radius * 1.5 * coronaIntensity)
    }
  })

  return (
    <group>
      {/* Corona effect */}
      <mesh ref={coronaRef} position={[0, 0, 0]}>
        <sphereGeometry args={[radius * 1.5, 16, 16]} />
        <meshStandardMaterial 
          color="#ff6b35" 
          emissive="#ff6b35" 
          emissiveIntensity={0.3} 
          transparent 
          opacity={0.2} 
        />
      </mesh>
      
      {/* Main star */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial 
          color="#fbbf24" 
          emissive="#f59e0b" 
          emissiveIntensity={0.9} 
        />
        <pointLight intensity={3} distance={100} color="#fbbf24" />
      </mesh>
    </group>
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
    // Better camera positioning for improved view
    camera.position.set(25, 20, 25)
    camera.lookAt(0, 0, 0)
  }, [camera])

  const systemData = useMemo(() => {
    const validPlanets = planets.filter(p => p && p.id && p.name)
    
    return validPlanets.slice(0, 10).map((planet, index) => {
      // Better orbital spacing - starts at 3 and increases moderately
      const orbitalRadius = 3 + index * 1.8
      // More evenly distributed angles
      const angle = (index / Math.min(validPlanets.length, 10)) * Math.PI * 2
      // Add some vertical variation for visual interest
      const yOffset = (Math.sin(index * 0.7) * 0.3)
      
      const position: [number, number, number] = [
        Math.cos(angle) * orbitalRadius,
        yOffset,
        Math.sin(angle) * orbitalRadius
      ]
      
      return {
        planet,
        orbitalRadius,
        position,
        orbitalSpeed: isAnimated ? 0.3 / Math.sqrt(orbitalRadius) : 0
      }
    })
  }, [planets, isAnimated])

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      
      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade />
      
      <CentralStar radius={0.5} />
      
      {systemData.map(({ planet, orbitalRadius, position, orbitalSpeed }) => (
        <React.Fragment key={planet.id}>
          <OrbitalPath radius={orbitalRadius} opacity={selectedPlanet === planet.id ? 0.6 : 0.3} />
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
        position={[0, 15, 0]}
        fontSize={1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Exoplanet System
      </Text>
      
      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
        autoRotate={false}
        dampingFactor={0.05}
        enableDamping={true}
      />
    </>
  )
}

const ExoplanetVisualization: React.FC<ExoplanetVisualizationProps> = ({ planets, isSampleData = false }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('galaxy')
  const [selectedSystem, setSelectedSystem] = useState<StarSystem | null>(null)
  const [selectedPlanet, setSelectedPlanet] = useState<ExoplanetData | null>(null)
  const [isAnimated, setIsAnimated] = useState(true)
  const [showOverlay, setShowOverlay] = useState(true)
  const [showSystemOverlay, setShowSystemOverlay] = useState(true)

  // Group planets by star system
  const starSystems = useMemo(() => {
    const systemMap: { [key: string]: ExoplanetData[] } = {}
    
    planets.forEach(planet => {
      const systemKey = planet.host_star || 'Unknown System'
      if (!systemMap[systemKey]) {
        systemMap[systemKey] = []
      }
      systemMap[systemKey].push(planet)
    })

    return Object.entries(systemMap).map(([starName, systemPlanets], index) => {
      // Generate galaxy positions in a spiral pattern
      const angle = (index / Object.keys(systemMap).length) * Math.PI * 4
      const radius = 5 + (index % 3) * 8
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      const y = (Math.random() - 0.5) * 4

      const avgDistance = systemPlanets.reduce((sum: number, p: ExoplanetData) => sum + (p.distance_from_earth ?? 0), 0) / systemPlanets.length

      return {
        id: starName,
        name: starName,
        planets: systemPlanets,
        planetCount: systemPlanets.length,
        position: [x, y, z] as [number, number, number],
        averageDistance: avgDistance
      }
    })
  }, [planets])

  const handleSystemSelect = (system: StarSystem) => {
    setSelectedSystem(system)
    setViewMode('system')
    setSelectedPlanet(null)
    setShowSystemOverlay(true) // Show system overlay when entering system view
  }

  const handlePlanetSelect = (planet: ExoplanetData) => {
    setSelectedPlanet(planet)
  }

  const resetView = () => {
    setViewMode('galaxy')
    setSelectedSystem(null)
    setSelectedPlanet(null)
    setShowOverlay(true) // Show galaxy overlay when returning to galaxy view
  }

  const backToGalaxy = () => {
    setViewMode('galaxy')
    setSelectedSystem(null)
    setSelectedPlanet(null)
    setShowOverlay(true) // Show galaxy overlay when going back to galaxy view
  }

  const getTemperatureCategory = (temp: number) => {
    if (temp < 200) return { category: 'Frozen', color: '#4f46e5', icon: '🧊' }
    if (temp < 400) return { category: 'Cold', color: '#0891b2', icon: '❄️' }
    if (temp < 600) return { category: 'Moderate', color: '#059669', icon: '🌍' }
    if (temp < 800) return { category: 'Hot', color: '#d97706', icon: '🔥' }
    return { category: 'Scorching', color: '#dc2626', icon: '🌋' }
  }

  return (
    <div className="exoplanet-visualization">
      {/* Enhanced Header */}
      <div className="viz-header">
        <div className="viz-title-section">
          {viewMode === 'galaxy' ? <Globe className="viz-icon" /> : <Zap className="viz-icon" />}
          <div>
            <h2>{viewMode === 'galaxy' ? 'Galaxy Explorer' : `${selectedSystem?.name || 'Star System'} Explorer`}</h2>
            <p className="viz-subtitle">
              {viewMode === 'galaxy' 
                ? `Interactive galaxy view • ${starSystems.length} star systems • ${planets.length} planets`
                : `Interactive system view • ${selectedSystem?.planetCount || 0} planets`
              }
            </p>
          </div>
        </div>
        
        <div className="viz-controls">
          {/* View Mode Toggle */}
          {viewMode === 'system' && (
            <button
              className="control-btn back-btn"
              onClick={backToGalaxy}
            >
              <Layers size={18} />
              <span>Back to Galaxy</span>
            </button>
          )}

          {/* System Selector (Galaxy Mode) */}
          {viewMode === 'galaxy' && (
            <div className="planet-selector">
              <select 
                value={selectedSystem?.id || ''}
                onChange={(e) => {
                  const systemId = e.target.value;
                  if (systemId) {
                    const system = starSystems.find(s => s.id === systemId);
                    if (system) handleSystemSelect(system);
                  }
                }}
                className="planet-dropdown"
              >
                <option value="">Select Star System...</option>
                {starSystems.map(system => (
                  <option key={system.id} value={system.id}>
                    {system.name} ({system.planetCount} planets)
                  </option>
                ))}
              </select>
              <ChevronDown className="dropdown-icon" size={16} />
            </div>
          )}

          {/* Planet Selector (System Mode) */}
          {viewMode === 'system' && selectedSystem && (
            <div className="planet-selector">
              <select 
                value={selectedPlanet?.id || ''}
                onChange={(e) => {
                  const planetId = e.target.value;
                  if (planetId) {
                    const planet = selectedSystem.planets.find(p => p.id === planetId);
                    if (planet) handlePlanetSelect(planet);
                  } else {
                    setSelectedPlanet(null);
                  }
                }}
                className="planet-dropdown"
              >
                <option value="">Select Planet...</option>
                {selectedSystem.planets.map(planet => (
                  <option key={planet.id} value={planet.id}>
                    {planet.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="dropdown-icon" size={16} />
            </div>
          )}
          
          <button
            className={`control-btn ${isAnimated ? 'active' : ''}`}
            onClick={() => setIsAnimated(!isAnimated)}
          >
            {isAnimated ? <Pause size={18} /> : <Play size={18} />}
            <span>{isAnimated ? 'Pause' : 'Play'}</span>
          </button>
          
          <button
            className="control-btn"
            onClick={resetView}
          >
            <RotateCcw size={18} />
            <span>Reset View</span>
          </button>
          
          {isSampleData && (
            <div className="sample-badge">
              <span>Sample Data</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="viz-content">
        {/* 3D Canvas */}
        <div className="canvas-section">
          <Canvas
            camera={{ 
              position: viewMode === 'galaxy' ? [0, 10, 25] : [15, 8, 15], 
              fov: viewMode === 'galaxy' ? 60 : 50 
            }}
            style={{ background: 'transparent' }}
          >
            {viewMode === 'galaxy' ? (
              // Galaxy View
              <>
                <ambientLight intensity={0.3} />
                <pointLight position={[10, 10, 10]} intensity={0.8} />
                <directionalLight position={[5, 5, 5]} intensity={0.4} />
                
                <Stars radius={150} depth={80} count={3000} factor={6} saturation={0} fade />
                
                {starSystems.map((system) => (
                  <GalaxyStarSystem
                    key={system.id}
                    system={system}
                    onClick={handleSystemSelect}
                    isSelected={false}
                  />
                ))}
                
                <Text
                  position={[0, 20, 0]}
                  fontSize={2}
                  color="#ffffff"
                  anchorX="center"
                  anchorY="middle"
                >
                  Exoplanet Galaxy
                </Text>
                
                <OrbitControls 
                  enablePan={true} 
                  enableZoom={true} 
                  enableRotate={true}
                  minDistance={10}
                  maxDistance={80}
                  autoRotate={isAnimated}
                  autoRotateSpeed={0.2}
                  dampingFactor={0.05}
                  enableDamping={true}
                />
              </>
            ) : (
              // System View
              selectedSystem && (
                <ExoplanetScene 
                  planets={selectedSystem.planets}
                  selectedPlanet={selectedPlanet?.id || null}
                  onPlanetSelect={handlePlanetSelect}
                  isAnimated={isAnimated}
                />
              )
            )}
          </Canvas>
          
          {/* Canvas Overlay Info */}
          {viewMode === 'galaxy' && showOverlay && (
            <div className="canvas-overlay">
              <div className="help-card">
                <button 
                  className="dismiss-overlay"
                  onClick={() => setShowOverlay(false)}
                  title="Dismiss overlay"
                >
                  <X size={16} />
                </button>
                <Globe className="help-icon" />
                <h3>Galaxy Explorer</h3>
                <p>Navigate through star systems in 3D space</p>
                <div className="orbit-info">
                  <span>• Click star systems to explore</span>
                  <span>• Larger systems have more planets</span>
                  <span>• Colors indicate distance from Earth</span>
                </div>
              </div>
            </div>
          )}
          
          {viewMode === 'system' && !selectedPlanet && showSystemOverlay && (
            <div className="canvas-overlay">
              <div className="help-card">
                <button 
                  className="dismiss-overlay"
                  onClick={() => setShowSystemOverlay(false)}
                  title="Dismiss overlay"
                >
                  <X size={16} />
                </button>
                <Target className="help-icon" />
                <h3>System Explorer</h3>
                <p>Click any planet to view detailed information</p>
                <div className="orbit-info">
                  <span>• Drag to rotate view</span>
                  <span>• Scroll to zoom</span>
                  <span>• Planets orbit in real-time</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data Panel */}
        {selectedPlanet && (
          <div className="data-panel">
            <div className="panel-header">
              <div className="planet-title">
                <Telescope className="planet-icon" />
                <div>
                  <h3>{selectedPlanet.name}</h3>
                  <p className="planet-host">Orbiting {selectedPlanet.host_star || 'Unknown System'}</p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setSelectedPlanet(null)}>
                x
              </button>
            </div>
            
            <div className="panel-content">
              {/* Temperature Card */}
              <div className="data-card temperature-card">
                <div className="card-header">
                  <Thermometer className="card-icon" />
                  <h4>Climate</h4>
                </div>
                <div className="temp-display">
                  <div className="temp-value">
                    <span className="temp-number">{(selectedPlanet.equilibrium_temperature ?? 0).toFixed(0)}</span>
                    <span className="temp-unit">K</span>
                  </div>
                  <div className="temp-category">
                    <span className="temp-emoji">{getTemperatureCategory(selectedPlanet.equilibrium_temperature ?? 0).icon}</span>
                    <span>{getTemperatureCategory(selectedPlanet.equilibrium_temperature ?? 0).category}</span>
                  </div>
                </div>
                <div className="temp-bar">
                  <div 
                    className="temp-fill"
                    style={{
                      width: `${Math.min(((selectedPlanet.equilibrium_temperature ?? 0) / 1000) * 100, 100)}%`,
                      backgroundColor: getTemperatureCategory(selectedPlanet.equilibrium_temperature ?? 0).color
                    }}
                  />
                </div>
              </div>

              {/* Physical Properties */}
              <div className="data-card">
                <div className="card-header">
                  <Orbit className="card-icon" />
                  <h4>Physical Properties</h4>
                </div>
                <div className="data-grid">
                  <div className="data-item">
                    <span className="label">Planet Radius</span>
                    <span className="value">{(selectedPlanet.planet_radius ?? 0).toFixed(2)} R⊕</span>
                  </div>
                  <div className="data-item">
                    <span className="label">Stellar Radius</span>
                    <span className="value">{(selectedPlanet.stellar_radius ?? 0).toFixed(2)} R☉</span>
                  </div>
                  <div className="data-item">
                    <span className="label">Orbital Period</span>
                    <span className="value">{(selectedPlanet.orbital_period ?? 0).toFixed(1)} days</span>
                  </div>
                </div>
              </div>

              {/* Discovery Information */}
              <div className="data-card">
                <div className="card-header">
                  <Calendar className="card-icon" />
                  <h4>Discovery</h4>
                </div>
                <div className="data-grid">
                  <div className="data-item">
                    <span className="label">Method</span>
                    <span className="value">{selectedPlanet.discovery_method || 'Unknown'}</span>
                  </div>
                  <div className="data-item">
                    <span className="label">Year</span>
                    <span className="value">{selectedPlanet.discovery_year || 'Unknown'}</span>
                  </div>
                  <div className="data-item">
                    <span className="label">Distance</span>
                    <span className="value">{(selectedPlanet.distance_from_earth ?? 0).toFixed(1)} ly</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="stats-grid">
                <div className="stat-card">
                  <Map className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-value">{(selectedPlanet.distance_from_earth ?? 0).toFixed(0)}</span>
                    <span className="stat-label">Light Years Away</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExoplanetVisualization