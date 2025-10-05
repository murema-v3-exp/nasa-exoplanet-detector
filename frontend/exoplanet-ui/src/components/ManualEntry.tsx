import React, { useState } from 'react'
import { Save, RefreshCw, Check, Zap, BarChart3 } from 'lucide-react'
import { apiService } from '../services/api'
import type { ExoplanetData, ManualPredictionInput, ManualPredictionResponse } from '../services/api'
import './ManualEntry.css'

interface ManualEntryProps {
  onExoplanetCreate: (exoplanet: ExoplanetData) => void
  isLoading?: boolean
}

const ManualEntry: React.FC<ManualEntryProps> = ({ onExoplanetCreate, isLoading = false }) => {
  const [mode, setMode] = useState<'create' | 'predict'>('create')
  const [formData, setFormData] = useState<Omit<ExoplanetData, 'id'>>({
    name: '',
    host_star: '',
    orbital_period: 0,
    planet_radius: 0,
    stellar_radius: 0,
    distance_from_earth: 0,
    discovery_method: 'Transit',
    discovery_year: new Date().getFullYear(),
    equilibrium_temperature: 0
  })
  
  // Prediction state with realistic defaults
  const [predictionData, setPredictionData] = useState<ManualPredictionInput>({
    orbital_period: 10.5,
    planet_radius: 2.3,
    transit_duration: 3.2,
    transit_depth: 1000,
    stellar_temp: 5778,
    model: 'xgb_multi'
  })
  const [predictionResult, setPredictionResult] = useState<ManualPredictionResponse | null>(null)
  const [predictionLoading, setPredictionLoading] = useState(false)
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  // Preset exoplanet examples for quick testing
  const presetExoplanets = [
    {
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
      name: 'WASP-121b',
      host_star: 'WASP-121',
      orbital_period: 1.27,
      planet_radius: 1.81,
      stellar_radius: 1.35,
      distance_from_earth: 850,
      discovery_method: 'Transit',
      discovery_year: 2015,
      equilibrium_temperature: 2359
    },
    {
      name: 'K2-18 b',
      host_star: 'K2-18',
      orbital_period: 32.9,
      planet_radius: 2.61,
      stellar_radius: 0.41,
      distance_from_earth: 124,
      discovery_method: 'Transit',
      discovery_year: 2015,
      equilibrium_temperature: 265
    }
  ]

  // Preset prediction examples for testing ML model
  const predictionPresets = [
    {
      name: 'Hot Jupiter (Likely Planet)',
      orbital_period: 3.5,
      planet_radius: 1.8,
      transit_duration: 2.4,
      transit_depth: 1200,
      stellar_temp: 6000,
      description: 'Typical hot Jupiter parameters - should classify as PLANET'
    },
    {
      name: 'Super Earth (Likely Planet)',
      orbital_period: 12.8,
      planet_radius: 1.6,
      transit_duration: 4.1,
      transit_depth: 800,
      stellar_temp: 5200,
      description: 'Super Earth in habitable zone - should classify as PLANET'
    },
    {
      name: 'False Positive Example',
      orbital_period: 0.5,
      planet_radius: 0.2,
      transit_duration: 0.1,
      transit_depth: 50,
      stellar_temp: 3000,
      description: 'Unrealistic parameters - should classify as FALSE POSITIVE'
    },
    {
      name: 'Earth-like (Borderline)',
      orbital_period: 365.25,
      planet_radius: 1.0,
      transit_duration: 13.0,
      transit_depth: 84,
      stellar_temp: 5778,
      description: 'Earth-like parameters - classification may vary'
    }
  ]

  const discoveryMethods = [
    'Transit',
    'Radial Velocity',
    'Gravitational Microlensing',
    'Direct Imaging',
    'Astrometry',
    'Transit Timing Variations',
    'Pulsar Timing'
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (mode === 'create') {
      if (!formData.name.trim()) newErrors.name = 'Planet name is required'
      if (!formData.host_star?.trim()) newErrors.host_star = 'Host star name is required'
      if ((formData.orbital_period ?? 0) <= 0) newErrors.orbital_period = 'Orbital period must be positive'
      if ((formData.planet_radius ?? 0) <= 0) newErrors.planet_radius = 'Planet radius must be positive'
      if ((formData.stellar_radius ?? 0) <= 0) newErrors.stellar_radius = 'Stellar radius must be positive'
      if ((formData.distance_from_earth ?? 0) <= 0) newErrors.distance_from_earth = 'Distance must be positive'
      if ((formData.discovery_year ?? 0) < 1995 || (formData.discovery_year ?? 0) > new Date().getFullYear() + 10) {
        newErrors.discovery_year = 'Discovery year must be between 1995 and ' + (new Date().getFullYear() + 10)
      }
      if ((formData.equilibrium_temperature ?? 0) < 0) newErrors.equilibrium_temperature = 'Temperature cannot be negative'
    } else {
      if (predictionData.orbital_period <= 0) newErrors.orbital_period = 'Orbital period must be positive'
      if (predictionData.planet_radius <= 0) newErrors.planet_radius = 'Planet radius must be positive'
      if (predictionData.transit_duration <= 0) newErrors.transit_duration = 'Transit duration must be positive'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePredict = async () => {
    if (!validateForm()) return
    
    setPredictionLoading(true)
    setPredictionResult(null)
    setErrors({})
    
    try {
      console.log('🚀 Starting manual prediction with data:', predictionData)
      const result = await apiService.predictManual(predictionData)
      console.log('✅ Prediction successful:', result)
      setPredictionResult(result)
      setSuccess(true)
    } catch (error) {
      console.error('❌ Prediction failed:', error)
      setErrors({ api: error instanceof Error ? error.message : 'Prediction failed' })
    } finally {
      setPredictionLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
    setSuccess(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === 'predict') {
      handlePredict()
      return
    }
    
    if (!validateForm()) {
      return
    }

    const exoplanet: ExoplanetData = {
      ...formData,
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    onExoplanetCreate(exoplanet)
    setSuccess(true)
    
    // Reset form after a delay
    setTimeout(() => {
      setSuccess(false)
      resetForm()
    }, 2000)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      host_star: '',
      orbital_period: 0,
      planet_radius: 0,
      stellar_radius: 0,
      distance_from_earth: 0,
      discovery_method: 'Transit',
      discovery_year: new Date().getFullYear(),
      equilibrium_temperature: 0
    })
    // Reset to realistic defaults for prediction mode
    setPredictionData({
      orbital_period: 10.5,
      planet_radius: 2.3,
      transit_duration: 3.2,
      transit_depth: 1000,
      stellar_temp: 5778,
      model: 'xgb_multi'
    })
    setPredictionResult(null)
    setErrors({})
    setSuccess(false)
  }

  const loadPreset = (index: number) => {
    if (index >= 0 && index < presetExoplanets.length) {
      setFormData(presetExoplanets[index])
      setErrors({})
      setSuccess(false)
    }
  }

  const loadPredictionPreset = (index: number) => {
    if (index >= 0 && index < predictionPresets.length) {
      const preset = predictionPresets[index]
      setPredictionData({
        orbital_period: preset.orbital_period,
        planet_radius: preset.planet_radius,
        transit_duration: preset.transit_duration,
        transit_depth: preset.transit_depth,
        stellar_temp: preset.stellar_temp,
        model: 'xgb_multi'
      })
      setPredictionResult(null)
      setErrors({})
      setSuccess(false)
    }
  }

  return (
    <div className="manual-entry">
      <div className="manual-entry-header">
        <div className="mode-selector">
          <button
            className={`mode-btn ${mode === 'create' ? 'active' : ''}`}
            onClick={() => { setMode('create'); setPredictionResult(null); setErrors({}); }}
          >
            <BarChart3 size={18} />
            Create for Visualization
          </button>
          <button
            className={`mode-btn ${mode === 'predict' ? 'active' : ''}`}
            onClick={() => { setMode('predict'); setSuccess(false); setErrors({}); }}
          >
            <Zap size={18} />
            Predict Classification
          </button>
        </div>
        
        <h2>{mode === 'create' ? 'Manual Exoplanet Entry' : 'Exoplanet Classification'}</h2>
        <p>
          {mode === 'create' 
            ? 'Enter the parameters of a confirmed or candidate exoplanet for visualization and analysis.'
            : 'Enter observational parameters to predict if this candidate is likely a planet or false positive.'
          }
        </p>
        
        {mode === 'create' && (
          <div className="preset-selector">
            <label htmlFor="preset-select">Quick Start with Examples:</label>
            <select
              id="preset-select"
              onChange={(e) => {
                const index = parseInt(e.target.value)
                if (!isNaN(index)) {
                  loadPreset(index)
                }
              }}
              disabled={isLoading}
            >
              <option value="">Select an example exoplanet...</option>
              {presetExoplanets.map((preset, index) => (
                <option key={index} value={index}>
                  {preset.name} - {preset.discovery_method}
                </option>
              ))}
            </select>
          </div>
        )}

        {mode === 'predict' && (
          <div className="preset-selector">
            <label htmlFor="prediction-preset-select">Test with Examples:</label>
            <select
              id="prediction-preset-select"
              onChange={(e) => {
                const index = parseInt(e.target.value)
                if (!isNaN(index)) {
                  loadPredictionPreset(index)
                }
              }}
              disabled={predictionLoading}
            >
              <option value="">Select a test case...</option>
              {predictionPresets.map((preset, index) => (
                <option key={index} value={index}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="manual-entry-form">
        <div className="form-grid">
          {mode === 'create' && (
            <>
              {/* Basic Information */}
              <div className="form-section">
                <h3>Basic Information</h3>
            
                <div className="form-group">
                  <label htmlFor="name">Planet Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Kepler-442b"
                    className={errors.name ? 'error' : ''}
                    disabled={isLoading}
                  />
                  {errors.name && <span className="error-message">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="host_star">Host Star *</label>
                  <input
                    type="text"
                    id="host_star"
                    value={formData.host_star || ''}
                    onChange={(e) => handleInputChange('host_star', e.target.value)}
                    placeholder="e.g., Kepler-442"
                    className={errors.host_star ? 'error' : ''}
                    disabled={isLoading}
                  />
                  {errors.host_star && <span className="error-message">{errors.host_star}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="discovery_method">Discovery Method</label>
                  <select
                    id="discovery_method"
                    value={formData.discovery_method || 'Transit'}
                    onChange={(e) => handleInputChange('discovery_method', e.target.value)}
                    disabled={isLoading}
                  >
                    {discoveryMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="discovery_year">Discovery Year</label>
                  <input
                    type="number"
                    id="discovery_year"
                    value={formData.discovery_year || new Date().getFullYear()}
                    onChange={(e) => handleInputChange('discovery_year', parseInt(e.target.value) || 0)}
                    min={1995}
                    max={new Date().getFullYear()}
                    className={errors.discovery_year ? 'error' : ''}
                    disabled={isLoading}
                  />
                  {errors.discovery_year && <span className="error-message">{errors.discovery_year}</span>}
                </div>
              </div>

              {/* Physical Properties */}
              <div className="form-section">
                <h3>Physical Properties</h3>
            
                <div className="form-group">
                  <label htmlFor="orbital_period">Orbital Period (days) *</label>
                  <input
                    type="number"
                    id="orbital_period"
                    value={formData.orbital_period || 0}
                    onChange={(e) => handleInputChange('orbital_period', parseFloat(e.target.value) || 0)}
                    step="0.01"
                    min="0.01"
                    placeholder="e.g., 112.3"
                    className={errors.orbital_period ? 'error' : ''}
                    disabled={isLoading}
                  />
                  {errors.orbital_period && <span className="error-message">{errors.orbital_period}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="planet_radius">Planet Radius (Earth radii) *</label>
                  <input
                    type="number"
                    id="planet_radius"
                    value={formData.planet_radius || 0}
                    onChange={(e) => handleInputChange('planet_radius', parseFloat(e.target.value) || 0)}
                    step="0.01"
                    min="0.01"
                    placeholder="e.g., 1.34"
                    className={errors.planet_radius ? 'error' : ''}
                    disabled={isLoading}
                  />
                  {errors.planet_radius && <span className="error-message">{errors.planet_radius}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="stellar_radius">Stellar Radius (Solar radii) *</label>
                  <input
                    type="number"
                    id="stellar_radius"
                    value={formData.stellar_radius || 0}
                    onChange={(e) => handleInputChange('stellar_radius', parseFloat(e.target.value) || 0)}
                    step="0.01"
                    min="0.01"
                    placeholder="e.g., 0.61"
                    className={errors.stellar_radius ? 'error' : ''}
                    disabled={isLoading}
                  />
                  {errors.stellar_radius && <span className="error-message">{errors.stellar_radius}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="equilibrium_temperature">Equilibrium Temperature (K)</label>
                  <input
                    type="number"
                    id="equilibrium_temperature"
                    value={formData.equilibrium_temperature || 0}
                    onChange={(e) => handleInputChange('equilibrium_temperature', parseFloat(e.target.value) || 0)}
                    step="1"
                    min="0"
                    max="3000"
                    placeholder="e.g., 233"
                    className={errors.equilibrium_temperature ? 'error' : ''}
                    disabled={isLoading}
                  />
                  {errors.equilibrium_temperature && <span className="error-message">{errors.equilibrium_temperature}</span>}
                </div>
              </div>

              {/* Distance */}
              <div className="form-section">
                <h3>Distance</h3>
            
                <div className="form-group">
                  <label htmlFor="distance_from_earth">Distance from Earth (light-years) *</label>
                  <input
                    type="number"
                    id="distance_from_earth"
                    value={formData.distance_from_earth || 0}
                    onChange={(e) => handleInputChange('distance_from_earth', parseFloat(e.target.value) || 0)}
                    step="0.1"
                    min="0.1"
                    placeholder="e.g., 1206"
                    className={errors.distance_from_earth ? 'error' : ''}
                    disabled={isLoading}
                  />
                  {errors.distance_from_earth && <span className="error-message">{errors.distance_from_earth}</span>}
                </div>
              </div>
            </>
          )}

          {mode === 'predict' && (
            <>
              {/* Prediction Parameters */}
              <div className="form-section">
                <h3>Observational Parameters</h3>
                
                <div className="form-group">
                  <label htmlFor="pred_orbital_period">Orbital Period (days) *</label>
                  <input
                    type="number"
                    id="pred_orbital_period"
                    value={predictionData.orbital_period}
                    onChange={(e) => setPredictionData(prev => ({ ...prev, orbital_period: parseFloat(e.target.value) || 0 }))}
                    placeholder="e.g., 365.25"
                    className={errors.orbital_period ? 'error' : ''}
                    disabled={predictionLoading}
                    step="0.01"
                    min="0"
                  />
                  {errors.orbital_period && <span className="error-message">{errors.orbital_period}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="pred_planet_radius">Planet Radius (Earth radii) *</label>
                  <input
                    type="number"
                    id="pred_planet_radius"
                    value={predictionData.planet_radius}
                    onChange={(e) => setPredictionData(prev => ({ ...prev, planet_radius: parseFloat(e.target.value) || 0 }))}
                    placeholder="e.g., 1.6"
                    className={errors.planet_radius ? 'error' : ''}
                    disabled={predictionLoading}
                    step="0.01"
                    min="0"
                  />
                  {errors.planet_radius && <span className="error-message">{errors.planet_radius}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="pred_transit_duration">Transit Duration (hours) *</label>
                  <input
                    type="number"
                    id="pred_transit_duration"
                    value={predictionData.transit_duration}
                    onChange={(e) => setPredictionData(prev => ({ ...prev, transit_duration: parseFloat(e.target.value) || 0 }))}
                    placeholder="e.g., 3.2"
                    className={errors.transit_duration ? 'error' : ''}
                    disabled={predictionLoading}
                    step="0.01"
                    min="0"
                  />
                  {errors.transit_duration && <span className="error-message">{errors.transit_duration}</span>}
                </div>
              </div>

              <div className="form-section">
                <h3>Optional Parameters</h3>
                
                <div className="form-group">
                  <label htmlFor="pred_transit_depth">Transit Depth (ppm)</label>
                  <input
                    type="number"
                    id="pred_transit_depth"
                    value={predictionData.transit_depth || ''}
                    onChange={(e) => setPredictionData(prev => ({ ...prev, transit_depth: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    placeholder="e.g., 1000 (optional)"
                    disabled={predictionLoading}
                    step="1"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pred_stellar_temp">Stellar Temperature (K)</label>
                  <input
                    type="number"
                    id="pred_stellar_temp"
                    value={predictionData.stellar_temp || ''}
                    onChange={(e) => setPredictionData(prev => ({ ...prev, stellar_temp: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    placeholder="e.g., 5778 (optional)"
                    disabled={predictionLoading}
                    step="1"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pred_model">Model</label>
                  <select
                    id="pred_model"
                    value={predictionData.model}
                    onChange={(e) => setPredictionData(prev => ({ ...prev, model: e.target.value }))}
                    disabled={predictionLoading}
                  >
                    <option value="xgb">XGBoost Baseline (Kepler)</option>
                    <option value="xgb_multi">XGBoost Multi-Dataset (Kepler+K2+TESS)</option>
                  </select>
                </div>
              </div>

              {/* Prediction Result */}
              {predictionResult && (
                <div className="form-section prediction-result">
                  <h3>Classification Result</h3>
                  <div className={`result-display ${predictionResult.prediction.toLowerCase().replace(' ', '-')}`}>
                    <div className="result-badge">
                      <strong>{predictionResult.prediction}</strong>
                    </div>
                    <div className="result-details">
                      <p><strong>Confidence:</strong> {predictionResult.confidence} ({(predictionResult.probability * 100).toFixed(1)}%)</p>
                      <p><strong>Model:</strong> {predictionResult.model_used.toUpperCase()}</p>
                      <p><strong>Interpretation:</strong> {predictionResult.interpretation}</p>
                    </div>
                  </div>
                </div>
              )}

              {errors.api && (
                <div className="form-section">
                  <div className="error-message api-error">
                    {errors.api}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={resetForm}
            className="btn btn-secondary"
            disabled={isLoading || predictionLoading}
          >
            <RefreshCw size={16} />
            Reset Form
          </button>
          
          <button
            type="submit"
            className={`btn btn-primary ${success ? 'success' : ''}`}
            disabled={isLoading || predictionLoading}
          >
            {mode === 'predict' ? (
              predictionLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Predicting...
                </>
              ) : success ? (
                <>
                  <Check size={16} />
                  Predicted!
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Predict Classification
                </>
              )
            ) : (
              success ? (
                <>
                  <Check size={16} />
                  Created!
                </>
              ) : (
                <>
                  <Save size={16} />
                  Create Exoplanet
                </>
              )
            )}
          </button>
        </div>
      </form>

      {/* Info Panel */}
      <div className="info-panel">
        <h4>Parameter Guidelines</h4>
        <ul>
          <li><strong>Orbital Period:</strong> Time for one complete orbit (0.01+ days)</li>
          <li><strong>Planet Radius:</strong> Relative to Earth (0.01+ Earth radii)</li>
          {mode === 'create' && (
            <>
              <li><strong>Stellar Radius:</strong> Relative to our Sun (0.01+ Solar radii)</li>
              <li><strong>Distance:</strong> From Earth in light-years (0.1+ ly)</li>
              <li><strong>Temperature:</strong> Equilibrium temperature in Kelvin (0-3000K)</li>
              <li><strong>Discovery Year:</strong> Between 1995 (first exoplanet) and present</li>
            </>
          )}
          {mode === 'predict' && (
            <>
              <li><strong>Transit Duration:</strong> How long the planet blocks its star (hours)</li>
              <li><strong>Transit Depth:</strong> Amount of starlight blocked (parts per million)</li>
              <li><strong>Stellar Temperature:</strong> Temperature of the host star (Kelvin)</li>
            </>
          )}
        </ul>
      </div>
    </div>
  )
}

export default ManualEntry