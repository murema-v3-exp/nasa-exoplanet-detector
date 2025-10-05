// API Service for communicating with the NASA Exoplanet Hunter backend
const API_BASE_URL = 'http://localhost:8000/api'

// Interfaces
export interface PredictionRequest {
  file: File
  telescope: string
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
  telescope: string
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
  description?: string
}

export interface HealthStatus {
  status: string
  models_loaded: string[]
  version: string
  uptime_seconds: number
}

export interface ManualPredictionInput {
  orbital_period: number
  planet_radius: number
  transit_duration: number
  transit_depth?: number
  stellar_temp?: number
  model?: string
  threshold?: number
}

export interface ManualPredictionResponse {
  success: boolean
  prediction: string
  probability: number
  confidence: string
  model_used: string
  features_used: Record<string, number>
  interpretation: string
}

export interface ExoplanetData {
  id: string
  name: string
  host_star?: string
  orbital_period?: number
  planet_radius?: number
  stellar_radius?: number
  distance_from_earth?: number
  discovery_method?: string
  discovery_year?: number
  equilibrium_temperature?: number
}

export interface DatasetInfo {
  name: string
  description: string
  sample_count: number
  columns: string[]
  telescope: string
}

export interface SampleDataResponse {
  success: boolean
  dataset: string
  data: Record<string, any>[]
  total_count: number
}

class ApiService {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  // Health check
  async checkHealth(): Promise<HealthStatus> {
    console.log('Checking API health:', `${this.baseURL}/health`)
    try {
      const response = await fetch(`${this.baseURL}/health`)
      console.log('Health check response:', {
        status: response.status,
        statusText: response.statusText
      })
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('API Health Status:', result)
      return result
    } catch (error) {
      console.error('Health check error:', error)
      throw new Error('Unable to connect to API server')
    }
  }

  // Upload file and get predictions
  async predictExoplanets(request: PredictionRequest): Promise<PredictionResponse> {
    const startTime = Date.now()
    
    console.log('PREDICTION REQUEST:', {
      fileName: request.file.name,
      fileSize: request.file.size,
      telescope: request.telescope,
      model: request.model || 'xgb',
      threshold: request.threshold || 0.5,
      timestamp: startTime
    })

    try {
      const formData = new FormData()
      formData.append('file', request.file)
      formData.append('telescope', request.telescope)
      
      if (request.model) {
        formData.append('model', request.model)
      }
      
      if (request.threshold !== undefined) {
        formData.append('threshold', request.threshold.toString())
      }

      console.log('Sending POST request to backend...', {
        url: `${this.baseURL}/predict`,
        telescope: request.telescope,
        model: request.model || 'xgb',
        threshold: request.threshold || 0.5
      })

      const response = await fetch(`${this.baseURL}/predict`, {
        method: 'POST',
        body: formData
      })

      const responseTime = Date.now()
      console.log('PREDICTION RESPONSE:', {
        status: response.status,
        statusText: response.statusText,
        responseTime: responseTime - startTime,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('PREDICTION ERROR:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        throw new Error(`Prediction failed: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      const completionTime = Date.now()

      console.log('PREDICTION SUCCESS:', {
        totalSamples: result.total_samples,
        planetsFound: result.summary?.predicted_planets,
        falsePositives: result.summary?.false_positives,
        meanProbability: result.summary?.mean_probability,
        processingTime: result.processing_time_ms,
        totalRequestTime: completionTime - startTime,
        modelUsed: result.model_used,
        telescope: result.telescope
      })

      console.log('Prediction result:', {
        samples: result.total_samples,
        planets: result.summary?.predicted_planets,
        model: result.model_used,
        telescope: result.telescope
      })

      console.log('Prediction completed successfully')
      return result

    } catch (error) {
      console.error('PREDICTION REQUEST FAILED:', {
        error: error,
        fileName: request.file?.name,
        telescope: request.telescope,
        model: request.model,
        requestTime: Date.now() - startTime
      })
      throw error
    }
  }

  // Get available models
  async getModels(): Promise<{ models: ModelInfo[] }> {
    console.log('Fetching models from:', `${this.baseURL}/models`)
    try {
      const response = await fetch(`${this.baseURL}/models`)
      console.log('Models response:', {
        status: response.status,
        statusText: response.statusText
      })
      
      if (!response.ok) {
        throw new Error(`Failed to get models: ${response.status}`)
      }
      
      const models = await response.json()
      console.log('Available models:', models)
      return models
    } catch (error) {
      console.error('Get models error:', error)
      throw error
    }
  }

  // Manual prediction for single exoplanet parameters
  async predictManual(input: ManualPredictionInput): Promise<ManualPredictionResponse> {
    console.log('🔮 MANUAL PREDICTION REQUEST:', {
      input,
      url: `${this.baseURL}/manual-predict`,
      timestamp: new Date().toISOString()
    })
    
    try {
      const response = await fetch(`${this.baseURL}/manual-predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(input)
      })

      console.log('📡 MANUAL PREDICTION RESPONSE:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ MANUAL PREDICTION ERROR:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        })
        throw new Error(`Manual prediction failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ MANUAL PREDICTION SUCCESS:', result)
      return result
    } catch (error) {
      console.error('💥 MANUAL PREDICTION EXCEPTION:', error)
      throw error
    }
  }

  // Get available datasets
  async getDatasets(): Promise<{ success: boolean, datasets: DatasetInfo[], total_count: number }> {
    console.log('Fetching datasets from:', `${this.baseURL}/datasets`)
    try {
      const response = await fetch(`${this.baseURL}/datasets`)
      console.log('Datasets response:', {
        status: response.status,
        statusText: response.statusText
      })
      
      if (!response.ok) {
        throw new Error(`Failed to get datasets: ${response.status}`)
      }
      
      const datasets = await response.json()
      console.log('Available datasets:', datasets)
      return datasets
    } catch (error) {
      console.error('Get datasets error:', error)
      throw error
    }
  }

  // Get sample data from a specific dataset
  async getSampleData(datasetName: string, limit: number = 100): Promise<SampleDataResponse> {
    const url = `${this.baseURL}/datasets/${datasetName.toLowerCase()}/sample?limit=${limit}`
    console.log('Fetching sample data from:', url)
    try {
      const response = await fetch(url)
      console.log('Sample data response:', {
        status: response.status,
        statusText: response.statusText,
        dataset: datasetName,
        limit: limit
      })
      
      if (!response.ok) {
        throw new Error(`Failed to get sample data: ${response.status}`)
      }
      
      const sampleData = await response.json()
      console.log('Sample data loaded:', {
        dataset: datasetName,
        count: sampleData.data?.length || 0,
        total_count: sampleData.total_count
      })
      return sampleData
    } catch (error) {
      console.error('Get sample data error:', error)
      throw error
    }
  }

  // Get combined sample data from all datasets
  async getCombinedSampleData(limitPerDataset: number = 50): Promise<SampleDataResponse> {
    try {
      const response = await fetch(`${this.baseURL}/datasets/combined/sample?limit_per_dataset=${limitPerDataset}`)
      if (!response.ok) {
        throw new Error(`Failed to get combined sample data: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Get combined sample data error:', error)
      throw error
    }
  }

  // Generate sample exoplanet data for visualization
  generateSampleExoplanets(predictions: SinglePrediction[]): ExoplanetData[] {
    return predictions.slice(0, 20).map((pred, index) => ({
      id: pred.id,
      name: `${pred.prediction === 'PLANET' ? 'Kepler' : 'KOI'}-${pred.id}`,
      host_star: `Star-${pred.id}`,
      orbital_period: pred.features.orbital_period || Math.random() * 365,
      planet_radius: pred.features.planet_radius || Math.random() * 5,
      stellar_radius: pred.features.stellar_radius || Math.random() * 2,
      distance_from_earth: Math.random() * 4000,
      discovery_method: 'Transit',
      discovery_year: 2020 + Math.floor(Math.random() * 5),
      equilibrium_temperature: Math.random() * 1000 + 200
    }))
  }
}

// API Status Helper
export async function getApiStatus(): Promise<{ connected: boolean, health?: HealthStatus }> {
  try {
    const health = await apiService.checkHealth()
    return { connected: true, health }
  } catch (error) {
    return { connected: false }
  }
}

export const apiService = new ApiService()
export default apiService