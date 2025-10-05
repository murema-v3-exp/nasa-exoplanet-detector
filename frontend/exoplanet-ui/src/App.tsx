import { useState, Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import './App.css'
import SpaceScene from './components/SpaceScene'
import FileUpload from './components/FileUpload'
import PredictionResults from './components/PredictionResults'
import ExoplanetVisualization from './components/ExoplanetVisualization'
import { Upload, Telescope, Zap, BarChart3, Wifi, WifiOff } from 'lucide-react'
import { apiService, getApiStatus } from './services/api'
import type { PredictionResponse, ExoplanetData } from './services/api'

function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'visualize' | 'results'>('upload')
  const [predictionData, setPredictionData] = useState<PredictionResponse | null>(null)
  const [exoplanets, setExoplanets] = useState<ExoplanetData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [apiConnected, setApiConnected] = useState(false)
  const [apiVersion, setApiVersion] = useState<string>('Unknown')

  // Sample exoplanet data for demonstration
  const sampleExoplanets: ExoplanetData[] = [
    {
      id: 'kepler-452b',
      name: 'Kepler-452b',
      host_star: 'Kepler-452',
      orbital_period: 384.8,
      planet_radius: 1.6,
      stellar_radius: 1.1,
      distance_from_earth: 1402,
      discovery_method: 'Transit',
      discovery_year: 2015,
      equilibrium_temperature: 265
    },
    {
      id: 'kepler-186f',
      name: 'Kepler-186f',
      host_star: 'Kepler-186',
      orbital_period: 129.9,
      planet_radius: 1.1,
      stellar_radius: 0.47,
      distance_from_earth: 582,
      discovery_method: 'Transit',
      discovery_year: 2014,
      equilibrium_temperature: 188
    },
    {
      id: 'trappist-1e',
      name: 'TRAPPIST-1e',
      host_star: 'TRAPPIST-1',
      orbital_period: 6.1,
      planet_radius: 0.92,
      stellar_radius: 0.12,
      distance_from_earth: 40,
      discovery_method: 'Transit',
      discovery_year: 2017,
      equilibrium_temperature: 251
    },
    {
      id: 'proxima-b',
      name: 'Proxima Centauri b',
      host_star: 'Proxima Centauri',
      orbital_period: 11.2,
      planet_radius: 1.17,
      stellar_radius: 0.15,
      distance_from_earth: 4.24,
      discovery_method: 'Radial Velocity',
      discovery_year: 2016,
      equilibrium_temperature: 234
    },
    {
      id: 'k2-18b',
      name: 'K2-18b',
      host_star: 'K2-18',
      orbital_period: 32.9,
      planet_radius: 2.3,
      stellar_radius: 0.36,
      distance_from_earth: 124,
      discovery_method: 'Transit',
      discovery_year: 2015,
      equilibrium_temperature: 279
    }
  ]

  // Check API health on component mount
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const status = await getApiStatus()
        setApiConnected(status.connected)
        if (status.health) {
          setApiVersion(status.health.version)
        }
      } catch (error) {
        console.error('API health check failed:', error)
        setApiConnected(false)
      }
    }

    checkApiHealth()
    // Check API health every 30 seconds
    const interval = setInterval(checkApiHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const handlePredictionComplete = (data: PredictionResponse) => {
    setPredictionData(data)
    // Generate exoplanet visualization data from predictions
    const exoplanetData = apiService.generateSampleExoplanets(data.predictions)
    setExoplanets(exoplanetData)
    setActiveTab('results')
  }

  return (
    <div className="app">
      {/* 3D Background */}
      <div className="space-background">
        <Canvas camera={{ position: [0, 0, 50], fov: 60 }}>
          <Suspense fallback={null}>
            <SpaceScene />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <OrbitControls enablePan={false} enableZoom={false} enableRotate={true} autoRotate autoRotateSpeed={0.5} />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="ui-overlay">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="logo">
              <Telescope className="logo-icon" />
              <h1>NASA Exoplanet Hunter</h1>
            </div>
            <p className="tagline">AI-Powered Exoplanet Detection • NASA Space Apps 2025</p>
          </div>
        </header>

        {/* Navigation */}
        <nav className="nav-tabs">
          <button 
            className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={20} />
            Upload Data
          </button>
          <button 
            className={`tab ${activeTab === 'visualize' ? 'active' : ''}`}
            onClick={() => setActiveTab('visualize')}
          >
            <Zap size={20} />
            3D Visualization
          </button>
          <button 
            className={`tab ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
            disabled={!predictionData}
          >
            <BarChart3 size={20} />
            Results
          </button>
        </nav>

        {/* Content */}
        <main className="main-content">
          {activeTab === 'upload' && (
            <FileUpload 
              onPredictionComplete={handlePredictionComplete}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              apiConnected={apiConnected}
            />
          )}
          
          {activeTab === 'visualize' && (
            <div className="visualization-container">
              <ExoplanetVisualization 
                planets={exoplanets.length > 0 ? exoplanets : sampleExoplanets}
                isSampleData={exoplanets.length === 0}
              />
            </div>
          )}
          
          {activeTab === 'results' && predictionData && (
            <PredictionResults data={predictionData} />
          )}
        </main>

        {/* Status Bar */}
        <footer className="status-bar">
          <div className="status-item">
            {apiConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
            <div className={`status-dot ${apiConnected ? 'active' : 'inactive'}`}></div>
            API Status: {apiConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div className="status-item">
            Version: {apiVersion}
          </div>
          <div className="status-item">
            Model: {predictionData?.model_used.toUpperCase() || 'XGBoost'}
          </div>
          <div className="status-item">
            Dataset: Kepler/K2/TESS
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
