// API Service for communicating with the NASA Exoplanet Hunter backend
const API_BASE_URL = 'http://localhost:8000/api'

export interface HealthStatus {
  status: string
  models_loaded: string[]
  version: string
  uptime_seconds: number
}

export interface PredictionRequest {
  file: File
  model?: string
  threshold?: number
}

export interface SinglePrediction {
  id: string
  prediction: 'PLANET' | 'FALSE POSITIVE'
  probability: number
  features: Record<string, number>
}

export interface PredictionSummary {
  predicted_planets: number
  false_positives: number
  mean_probability: number
  high_confidence_count: number
}

export interface PredictionResponse {
  success: boolean
  model_used: string
  threshold: number
  total_samples: number
  predictions: SinglePrediction[]
  summary: PredictionSummary
  processing_time_ms: number
}

export interface ApiError {
  success: false
  error: string
  detail?: string
}

export interface ModelInfo {
  id: string
  name: string
  type: string
  status: string
  performance?: Record<string, number>
  note?: string
}

export interface ManualPredictionInput {
  orbital_period: number
  planet_radius: number
  transit_duration: number
  transit_depth?: number
  stellar_temp?: number
  model?: string
}

export interface ManualPredictionResponse {
  success: boolean
  prediction: 'PLANET' | 'FALSE POSITIVE'
  probability: number
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  model_used: string
  features_used: Record<string, number>
  interpretation: string
}

class ApiService {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  // Health check
  async checkHealth(): Promise<HealthStatus> {
    try {
      const response = await fetch(`${this.baseURL}/health`)
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Health check error:', error)
      throw new Error('Unable to connect to API server')
    }
  }

  // Upload file and get predictions
  async predictExoplanets(request: PredictionRequest): Promise<PredictionResponse> {
    try {
      const formData = new FormData()
      formData.append('file', request.file)
      
      if (request.model) {
        formData.append('model', request.model)
      }
      
      if (request.threshold !== undefined) {
        formData.append('threshold', request.threshold.toString())
      }

      const response = await fetch(`${this.baseURL}/predict`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || `Prediction failed: ${response.status}`)
      }

      return result
    } catch (error) {
      console.error('Prediction error:', error)
      throw error
    }
  }

  // Get available models
  async getModels(): Promise<{ models: ModelInfo[] }> {
    try {
      const response = await fetch(`${this.baseURL}/models`)
      if (!response.ok) {
        throw new Error(`Failed to get models: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Get models error:', error)
      throw error
    }
  }

  // Manual prediction for single exoplanet parameters
  async predictManual(input: ManualPredictionInput): Promise<ManualPredictionResponse> {
    try {
      const response = await fetch(`${this.baseURL}/manual-predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || `Manual prediction failed: ${response.status}`)
      }

      return result
    } catch (error) {
      console.error('Manual prediction error:', error)
      throw error
    }
  }

  // Generate sample exoplanet data for visualization
  generateSampleExoplanets(predictions: SinglePrediction[]): ExoplanetData[] {
    return predictions.slice(0, 20).map((pred, index) => ({
      id: pred.id,
      name: `${pred.prediction === 'PLANET' ? 'Kepler' : 'KOI'}-${pred.id}`,
      host_star: `Star-${pred.id.split('-')[0] || index}`,
      orbital_period: pred.features.orbital_period || (Math.random() * 365 + 1),
      planet_radius: pred.features.planet_radius || (Math.random() * 20 + 0.5),
      stellar_radius: pred.features.stellar_radius || (Math.random() * 3 + 0.5),
      distance_from_earth: Math.random() * 1000 + 10,
      discovery_method: 'Transit',
      discovery_year: 2020 + Math.floor(Math.random() * 5),
      equilibrium_temperature: pred.features.equilibrium_temperature || (Math.random() * 2000 + 200)
    }))
  }
}

export interface ExoplanetData {
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

// Create singleton instance
export const apiService = new ApiService()

// Utility functions for API status
export const checkApiConnection = async (): Promise<boolean> => {
  try {
    await apiService.checkHealth()
    return true
  } catch {
    return false
  }
}

export const getApiStatus = async (): Promise<{ 
  connected: boolean
  health?: HealthStatus
  error?: string 
}> => {
  try {
    const health = await apiService.checkHealth()
    return { connected: true, health }
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}