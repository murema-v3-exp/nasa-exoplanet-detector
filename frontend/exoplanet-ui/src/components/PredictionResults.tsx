import React, { useState, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import { BarChart3, Target, Download, Filter, Eye, EyeOff } from 'lucide-react'
import * as THREE from 'three'
import './PredictionResults.css'

interface PredictionData {
  success: boolean
  model_used: string
  threshold: number
  total_samples: number
  predictions: Array<{
    id: string
    prediction: 'PLANET' | 'FALSE POSITIVE'
    probability: number
    features: Record<string, number>
  }>
  summary: {
    predicted_planets: number
    false_positives: number
    mean_probability: number
    high_confidence_count: number
  }
  processing_time_ms: number
}

interface PredictionResultsProps {
  data: PredictionData
}

// 3D Data Point Component
const DataPoint: React.FC<{ 
  position: [number, number, number]
  isPlanet: boolean
  probability: number
  onClick: () => void
}> = ({ position, isPlanet, probability, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5
    }
  })

  return (
    <mesh ref={meshRef} position={position} onClick={onClick} scale={probability * 2 + 0.5}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial 
        color={isPlanet ? '#10b981' : '#ef4444'} 
        emissive={isPlanet ? '#065f46' : '#7f1d1d'}
        transparent
        opacity={0.8}
      />
    </mesh>
  )
}

// 3D Visualization of Results
const Results3D: React.FC<{ predictions: PredictionData['predictions'] }> = ({ predictions }) => {


  const dataPoints = useMemo(() => {
    return predictions.slice(0, 200).map((pred) => ({
      ...pred,
      position: [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      ] as [number, number, number]
    }))
  }, [predictions])

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color="#3b82f6" />
      
      {dataPoints.map((point) => (
        <DataPoint
          key={point.id}
          position={point.position}
          isPlanet={point.prediction === 'PLANET'}
          probability={point.probability}
          onClick={() => console.log('Selected:', point.id)}
        />
      ))}
      
      <Text
        position={[0, 12, 0]}
        fontSize={1}
        color="#e2e8f0"
        anchorX="center"
        anchorY="middle"
      >
        Exoplanet Detection Results
      </Text>
      
      <Text
        position={[-8, -12, 0]}
        fontSize={0.5}
        color="#10b981"
        anchorX="center"
        anchorY="middle"
      >
        🟢 Planets
      </Text>
      
      <Text
        position={[8, -12, 0]}
        fontSize={0.5}
        color="#ef4444"
        anchorX="center"
        anchorY="middle"
      >
        🔴 False Positives
      </Text>
      
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
    </>
  )
}

const PredictionResults: React.FC<PredictionResultsProps> = ({ data }) => {
  const [view, setView] = useState<'summary' | 'detailed' | '3d'>('summary')
  const [filter, setFilter] = useState<'all' | 'planets' | 'false_positives'>('all')
  const [showVisualization, setShowVisualization] = useState(true)

  const filteredPredictions = useMemo(() => {
    switch (filter) {
      case 'planets':
        return data.predictions.filter(p => p.prediction === 'PLANET')
      case 'false_positives':
        return data.predictions.filter(p => p.prediction === 'FALSE POSITIVE')
      default:
        return data.predictions
    }
  }, [data.predictions, filter])

  const downloadCSV = () => {
    const csv = [
      ['ID', 'Prediction', 'Probability', 'Orbital Period', 'Planet Radius'].join(','),
      ...filteredPredictions.map(p => [
        p.id,
        p.prediction,
        p.probability.toFixed(4),
        p.features.orbital_period || '',
        p.features.planet_radius || ''
      ].join(','))
    ].join('\\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `exoplanet_predictions_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="prediction-results">
      <div className="results-header">
        <div className="results-title">
          <Target className="title-icon" size={24} />
          <h2>Prediction Results</h2>
          <span className="processing-time">{data.processing_time_ms.toFixed(0)}ms</span>
        </div>
        
        <div className="results-actions">
          <button 
            className="visualization-toggle"
            onClick={() => setShowVisualization(!showVisualization)}
          >
            {showVisualization ? <EyeOff size={16} /> : <Eye size={16} />}
            {showVisualization ? 'Hide' : 'Show'} 3D
          </button>
          <button className="download-btn" onClick={downloadCSV}>
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card planets">
          <div className="card-icon">🪐</div>
          <div className="card-content">
            <h3>{data.summary.predicted_planets}</h3>
            <p>Potential Planets</p>
            <span className="percentage">
              {((data.summary.predicted_planets / data.total_samples) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        
        <div className="summary-card false-positives">
          <div className="card-icon">❌</div>
          <div className="card-content">
            <h3>{data.summary.false_positives}</h3>
            <p>False Positives</p>
            <span className="percentage">
              {((data.summary.false_positives / data.total_samples) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        
        <div className="summary-card confidence">
          <div className="card-icon">⭐</div>
          <div className="card-content">
            <h3>{data.summary.high_confidence_count}</h3>
            <p>High Confidence</p>
            <span className="percentage">
              {((data.summary.high_confidence_count / data.total_samples) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        
        <div className="summary-card average">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>{(data.summary.mean_probability * 100).toFixed(1)}%</h3>
            <p>Mean Probability</p>
            <span className="model-info">Model: {data.model_used.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* 3D Visualization */}
      {showVisualization && (
        <div className="visualization-container">
          <Canvas camera={{ position: [0, 0, 25], fov: 60 }}>
            <Results3D predictions={filteredPredictions} />
          </Canvas>
        </div>
      )}

      {/* Controls */}
      <div className="results-controls">
        <div className="view-tabs">
          <button 
            className={`tab ${view === 'summary' ? 'active' : ''}`}
            onClick={() => setView('summary')}
          >
            <BarChart3 size={16} />
            Summary
          </button>
          <button 
            className={`tab ${view === 'detailed' ? 'active' : ''}`}
            onClick={() => setView('detailed')}
          >
            <Filter size={16} />
            Detailed
          </button>
        </div>
        
        <div className="filter-controls">
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            <option value="all">All Predictions ({data.predictions.length})</option>
            <option value="planets">Planets Only ({data.summary.predicted_planets})</option>
            <option value="false_positives">False Positives ({data.summary.false_positives})</option>
          </select>
        </div>
      </div>

      {/* Results Table/List */}
      {view === 'detailed' && (
        <div className="results-table-container">
          <div className="results-table">
            <div className="table-header">
              <div>ID</div>
              <div>Prediction</div>
              <div>Probability</div>
              <div>Period (days)</div>
              <div>Radius (R⊕)</div>
            </div>
            
            {filteredPredictions.slice(0, 100).map((prediction) => (
              <div key={prediction.id} className="table-row">
                <div className="prediction-id">{prediction.id}</div>
                <div className={`prediction-type ${prediction.prediction.toLowerCase().replace(' ', '-')}`}>
                  {prediction.prediction === 'PLANET' ? '🪐' : '❌'} {prediction.prediction}
                </div>
                <div className="probability">
                  <div className="probability-bar">
                    <div 
                      className="probability-fill"
                      style={{ width: `${prediction.probability * 100}%` }}
                    ></div>
                  </div>
                  {(prediction.probability * 100).toFixed(1)}%
                </div>
                <div>{prediction.features.orbital_period?.toFixed(2) || 'N/A'}</div>
                <div>{prediction.features.planet_radius?.toFixed(2) || 'N/A'}</div>
              </div>
            ))}
          </div>
          
          {filteredPredictions.length > 100 && (
            <div className="table-footer">
              Showing first 100 of {filteredPredictions.length} predictions
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PredictionResults