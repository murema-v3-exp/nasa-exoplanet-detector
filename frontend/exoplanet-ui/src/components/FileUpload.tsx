import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Upload, FileText, Zap, Settings, AlertCircle, CheckCircle, Loader} from 'lucide-react'
import * as THREE from 'three'
import { apiService } from '../services/api'
import type { PredictionResponse, ModelInfo } from '../services/api'

interface FileUploadProps {
  onPredictionComplete: (data: PredictionResponse) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  apiConnected: boolean
}

interface UploadSettings {
  model: string
  threshold: number
}

// 3D Floating Orb Component
const FloatingOrb: React.FC<{ position: [number, number, number]; color: string }> = ({ position, color }) => {
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.5
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial 
        color={color} 
        transparent 
        opacity={0.8}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  )
}

// 3D Upload Visualization
const Upload3D: React.FC<{ isActive: boolean; hasFile: boolean }> = ({ isActive, hasFile }) => {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      
      {/* Background orbs */}
      <FloatingOrb position={[-2, 0, -1]} color={isActive ? "#3b82f6" : "#6366f1"} />
      <FloatingOrb position={[2, 1, -1]} color={hasFile ? "#10b981" : "#8b5cf6"} />
      <FloatingOrb position={[0, -1.5, -2]} color={isActive ? "#f59e0b" : "#64748b"} />
      
      {/* Central upload indicator */}
      {hasFile && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            color="#10b981" 
            transparent 
            opacity={0.6}
            emissive="#10b981"
            emissiveIntensity={0.3}
          />
        </mesh>
      )}
    </Canvas>
  )
}

const FileUpload: React.FC<FileUploadProps> = ({ onPredictionComplete, isLoading, setIsLoading, apiConnected }) => {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [settings, setSettings] = useState<UploadSettings>({
    model: 'xgb',
    threshold: 0.5
  })
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      if (files[0].type === 'text/csv' || files[0].name.endsWith('.csv')) {
        setFile(files[0])
        setError(null)
      } else {
        setError('Please upload a CSV file')
      }
    }
  }, [])

  // Fetch available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      if (!apiConnected) return
      
      setModelsLoading(true)
      try {
        const response = await apiService.getModels()
        setAvailableModels(response.models)
        
        // Set default model to first available model if current selection is not available
        const availableModelIds = response.models.map(m => m.id)
        if (!availableModelIds.includes(settings.model)) {
          const firstAvailableModel = response.models.find(m => m.status === 'ready')
          if (firstAvailableModel) {
            setSettings(prev => ({ ...prev, model: firstAvailableModel.id }))
          }
        }
      } catch (error) {
        console.error('Failed to fetch models:', error)
        // Fallback to hardcoded models
        setAvailableModels([
          { id: 'xgb', name: 'XGBoost Baseline', type: 'gradient_boosting', status: 'ready' }
        ])
      } finally {
        setModelsLoading(false)
      }
    }
    
    fetchModels()
  }, [apiConnected, settings.model])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    const files = e.target.files
    if (files && files[0]) {
      if (files[0].type === 'text/csv' || files[0].name.endsWith('.csv')) {
        setFile(files[0])
        setError(null)
      } else {
        setError('Please upload a CSV file')
      }
    }
  }

  const handlePredict = async () => {
    if (!file) return
    
    if (!apiConnected) {
      setError('API server is not connected. Please check if the backend is running.')
      return
    }
    
    setIsLoading(true)
    setError(null)
    setUploadProgress(0)
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + Math.random() * 20, 90))
      }, 200)
      
      const data = await apiService.predictExoplanets({
        file,
        model: settings.model,
        threshold: settings.threshold
      })
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      // Small delay to show completion
      setTimeout(() => {
        onPredictionComplete(data)
      }, 500)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file')
      setUploadProgress(0)
    } finally {
      setTimeout(() => setIsLoading(false), 1000)
    }
  }

  return (
    <div className="file-upload-container">
      <style>{`
        .file-upload-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .upload-header {
          text-align: center;
          margin-bottom: 2rem;
          border-bottom: 1px solid rgba(0, 212, 255, 0.2);
          padding-bottom: 1.5rem;
        }

        .upload-header h2 {
          font-family: 'JetBrains Mono', monospace;
          font-size: 2rem;
          background: linear-gradient(45deg, #00d4ff, #ff0080, #7c3aed);
          background-size: 200% 200%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
          animation: gradientShift 3s ease-in-out infinite;
        }

        .upload-header p {
          font-family: 'JetBrains Mono', monospace;
          color: rgba(0, 255, 65, 0.8);
          font-size: 0.9rem;
          line-height: 1.5;
          letter-spacing: 0.05em;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .upload-zone {
          position: relative;
          border: 2px dashed rgba(0, 212, 255, 0.3);
          border-radius: 12px;
          background: linear-gradient(135deg, 
            rgba(0, 20, 40, 0.95), 
            rgba(15, 23, 42, 0.8));
          backdrop-filter: blur(20px);
          padding: 3rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 300px;
          overflow: hidden;
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .upload-zone:hover {
          border-color: #00d4ff;
          background: linear-gradient(135deg, 
            rgba(0, 212, 255, 0.1), 
            rgba(15, 23, 42, 0.9));
          transform: translateY(-2px);
          box-shadow: 
            0 35px 60px rgba(0, 0, 0, 0.4),
            0 0 30px rgba(0, 212, 255, 0.2);
        }

        .upload-zone.drag-active {
          border-color: #00ff41;
          background: linear-gradient(135deg, 
            rgba(0, 255, 65, 0.1), 
            rgba(15, 23, 42, 0.9));
          transform: scale(1.02);
          box-shadow: 
            0 0 50px rgba(0, 255, 65, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .upload-zone.has-file {
          border-color: #00ff41;
          background: linear-gradient(135deg, 
            rgba(0, 255, 65, 0.1), 
            rgba(15, 23, 42, 0.9));
          box-shadow: 
            0 0 30px rgba(0, 255, 65, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .upload-3d-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0.6;
          pointer-events: none;
        }

        .upload-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .upload-icon, .file-icon {
          color: #3b82f6;
          margin-bottom: 1rem;
        }

        .file-icon {
          color: #10b981;
        }

        .upload-content h3 {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.3rem;
          color: #ffffff;
          margin: 0;
          font-weight: 600;
        }

        .upload-content p {
          font-family: 'JetBrains Mono', monospace;
          color: rgba(0, 255, 65, 0.8);
          margin: 0;
          font-size: 0.9rem;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(148, 163, 184, 0.8);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: rgba(0, 20, 40, 0.6);
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 6px;
        }

        .file-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .remove-file {
          padding: 0.5rem 1rem;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid #ef4444;
          border-radius: 0.5rem;
          color: #fecaca;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .remove-file:hover {
          background: rgba(239, 68, 68, 0.3);
        }

        .settings-panel {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(71, 85, 105, 0.5);
          border-radius: 1rem;
          padding: 2rem;
          backdrop-filter: blur(10px);
        }

        .settings-panel h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #e2e8f0;
          margin: 0 0 1.5rem 0;
          font-size: 1.25rem;
        }

        .setting-group {
          margin-bottom: 1.5rem;
        }

        .setting-group:last-child {
          margin-bottom: 0;
        }

        .setting-group label {
          display: block;
          color: #cbd5e1;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .loading-text {
          color: rgba(0, 212, 255, 0.8);
          font-size: 0.75rem;
          font-weight: 400;
        }

        .setting-group select {
          width: 100%;
          padding: 0.75rem;
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(71, 85, 105, 0.5);
          border-radius: 0.5rem;
          color: #e2e8f0;
          font-size: 0.875rem;
        }

        .setting-group select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }

        .threshold-slider {
          width: 100%;
          margin: 0.5rem 0;
        }

        .threshold-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #64748b;
        }

        .predict-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: none;
          border-radius: 0.75rem;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 60px;
        }

        .predict-button:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
        }

        .predict-button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #374151;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 0.5rem;
          color: #fecaca;
          font-size: 0.875rem;
        }

        .success-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 0.5rem;
          color: #a7f3d0;
          font-size: 0.875rem;
        }

        .loading-animation {
          text-align: center;
          padding: 2rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(59, 130, 246, 0.3);
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem auto;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(71, 85, 105, 0.5);
          border-radius: 3px;
          overflow: hidden;
          margin: 1rem 0;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #10b981);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .file-upload-container {
            padding: 1rem;
          }
          
          .upload-zone {
            padding: 2rem 1rem;
            min-height: 250px;
          }
          
          .settings-panel {
            padding: 1.5rem;
          }
        }
      `}</style>

      <div className="upload-header">
        <h2>Upload Exoplanet Data</h2>
        <p>// Upload CSV files from Kepler, K2, or TESS missions for AI-powered exoplanet detection</p>
      </div>

      {/* File Drop Zone with 3D Background */}
      <div
        className={`upload-zone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <div className="upload-3d-bg">
          <Upload3D isActive={dragActive} hasFile={!!file} />
        </div>

        <input
          id="fileInput"
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        
        <div className="upload-content">
          {!file ? (
            <>
              <Upload className="upload-icon" size={48} />
              <h3>Drop CSV file here or click to browse</h3>
              <p>// Supports: Kepler KOI, K2, TESS TOI formats</p>
              <div className="file-info">
                <FileText size={16} />
                <span>Max size: 50MB • CSV format only</span>
              </div>
            </>
          ) : (
            <>
              <FileText className="file-icon" size={48} />
              <h3>{file.name}</h3>
              <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <div className="file-actions">
                <button 
                  className="remove-file"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                    setError(null)
                  }}
                >
                  Remove File
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      <div className="settings-panel">
        <h3><Settings size={20} /> Prediction Settings</h3>
        
        <div className="setting-group">
          <label>Model Selection {modelsLoading && <span className="loading-text">(Loading...)</span>}</label>
          <select 
            value={settings.model} 
            onChange={(e) => setSettings(prev => ({ ...prev, model: e.target.value }))}
            disabled={isLoading || modelsLoading}
          >
            {availableModels.length > 0 ? (
              availableModels.map(model => {
                const performanceText = model.performance?.recall 
                  ? ` (${(model.performance.recall * 100).toFixed(1)}% Recall)`
                  : ''
                const statusIcon = model.status === 'ready' ? ' ✅' : ''
                const isDisabled = model.status !== 'ready'
                
                return (
                  <option 
                    key={model.id} 
                    value={model.id}
                    disabled={isDisabled}
                  >
                    {model.name}{performanceText}{statusIcon}
                    {model.note && ` - ${model.note}`}
                  </option>
                )
              })
            ) : (
              <option value="xgb">XGBoost Baseline (Loading models...)</option>
            )}
          </select>
        </div>
        
        <div className="setting-group">
          <label>Classification Threshold: {settings.threshold.toFixed(2)}</label>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={settings.threshold}
            onChange={(e) => setSettings(prev => ({ ...prev, threshold: parseFloat(e.target.value) }))}
            className="threshold-slider"
            disabled={isLoading}
          />
          <div className="threshold-labels">
            <span>Conservative (0.1)</span>
            <span>Balanced (0.5)</span>
            <span>Strict (0.9)</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {uploadProgress === 100 && !error && (
        <div className="success-message">
          <CheckCircle size={20} />
          File processed successfully! Redirecting to results...
        </div>
      )}

      {/* Predict Button */}
      <button 
        className={`predict-button ${!file || isLoading ? 'disabled' : ''}`}
        onClick={handlePredict}
        disabled={!file || isLoading}
      >
        {isLoading ? (
          <>
            <Loader className="animate-spin" size={20} />
            Analyzing Data...
          </>
        ) : (
          <>
            <Zap size={20} />
            Predict Exoplanets
          </>
        )}
      </button>

      {/* Loading Animation */}
      {isLoading && (
        <div className="loading-animation">
          <div className="loading-spinner"></div>
          <p>Processing {file?.name}...</p>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Running {settings.model.toUpperCase()} model on {Math.round((file?.size || 0) / 1024)} KB of astronomical data
          </p>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.75rem' }}>
            {uploadProgress < 30 ? 'Loading data...' : 
             uploadProgress < 60 ? 'Extracting features...' :
             uploadProgress < 90 ? 'Running predictions...' : 'Finalizing results...'}
          </p>
        </div>
      )}
    </div>
  )
}

export default FileUpload
