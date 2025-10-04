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
              {exoplanets.length > 0 ? (
                <ExoplanetVisualization planets={exoplanets} />
              ) : (
                <div className="no-data-message">
                  <Telescope size={48} />
                  <h3>No Exoplanet Data</h3>
                  <p>Upload and analyze data first to see 3D visualizations</p>
                </div>
              )}
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
