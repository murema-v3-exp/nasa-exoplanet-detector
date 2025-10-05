import React, { useState } from 'react'
import { Save, RefreshCw, Check } from 'lucide-react'
import type { ExoplanetData } from '../services/api'
import './ManualEntry.css'

interface ManualEntryProps {
  onExoplanetCreate: (exoplanet: ExoplanetData) => void
  isLoading?: boolean
}

const ManualEntry: React.FC<ManualEntryProps> = ({ onExoplanetCreate, isLoading = false }) => {
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

  const discoveryMethods = [
    'Transit',
    'Radial Velocity',
    'Gravitational Microlensing',
    'Direct Imaging',
    'Astrometry',
    'Transit Timing Variations',
    'Pulsar Timing'
  ]

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Planet name is required'
    }

    if (!formData.host_star.trim()) {
      newErrors.host_star = 'Host star name is required'
    }

    if (formData.orbital_period <= 0) {
      newErrors.orbital_period = 'Orbital period must be positive'
    }

    if (formData.planet_radius <= 0) {
      newErrors.planet_radius = 'Planet radius must be positive'
    }

    if (formData.stellar_radius <= 0) {
      newErrors.stellar_radius = 'Stellar radius must be positive'
    }

    if (formData.distance_from_earth <= 0) {
      newErrors.distance_from_earth = 'Distance must be positive'
    }

    if (formData.discovery_year < 1995 || formData.discovery_year > new Date().getFullYear()) {
      newErrors.discovery_year = `Discovery year must be between 1995 and ${new Date().getFullYear()}`
    }

    if (formData.equilibrium_temperature < 0 || formData.equilibrium_temperature > 3000) {
      newErrors.equilibrium_temperature = 'Temperature must be between 0K and 3000K'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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

  return (
    <div className="manual-entry">
      <div className="manual-entry-header">
        <h2>Manual Exoplanet Entry</h2>
        <p>Enter the parameters of a confirmed or candidate exoplanet for visualization and analysis.</p>
        
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
      </div>

      <form onSubmit={handleSubmit} className="manual-entry-form">
        <div className="form-grid">
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
                value={formData.host_star}
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
                value={formData.discovery_method}
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
                value={formData.discovery_year}
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
                value={formData.orbital_period}
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
                value={formData.planet_radius}
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
                value={formData.stellar_radius}
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
                value={formData.equilibrium_temperature}
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
                value={formData.distance_from_earth}
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
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={resetForm}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            <RefreshCw size={16} />
            Reset Form
          </button>
          
          <button
            type="submit"
            className={`btn btn-primary ${success ? 'success' : ''}`}
            disabled={isLoading}
          >
            {success ? (
              <>
                <Check size={16} />
                Created!
              </>
            ) : (
              <>
                <Save size={16} />
                Create Exoplanet
              </>
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
          <li><strong>Stellar Radius:</strong> Relative to our Sun (0.01+ Solar radii)</li>
          <li><strong>Distance:</strong> From Earth in light-years (0.1+ ly)</li>
          <li><strong>Temperature:</strong> Equilibrium temperature in Kelvin (0-3000K)</li>
          <li><strong>Discovery Year:</strong> Between 1995 (first exoplanet) and present</li>
        </ul>
      </div>
    </div>
  )
}

export default ManualEntry