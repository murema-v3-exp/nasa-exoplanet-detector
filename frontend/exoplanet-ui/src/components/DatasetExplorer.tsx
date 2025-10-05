import React, { useState, useEffect } from 'react'
import { Database, Download, Search, Filter, Globe, Satellite, Target } from 'lucide-react'
import { apiService } from '../services/api'
import type { DatasetInfo, SampleDataResponse, ExoplanetData } from '../services/api'

interface DatasetExplorerProps {
  onExoplanetSelect?: (exoplanets: ExoplanetData[]) => void
}

const DatasetExplorer: React.FC<DatasetExplorerProps> = ({ onExoplanetSelect }) => {
  const [datasets, setDatasets] = useState<DatasetInfo[]>([])
  const [selectedDataset, setSelectedDataset] = useState<string>('')
  const [sampleData, setSampleData] = useState<ExoplanetData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sampleLimit, setSampleLimit] = useState(50)
  const [searchTerm, setSearchTerm] = useState('')

  // Load available datasets
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        const response = await apiService.getDatasets()
        if (response.success) {
          setDatasets(response.datasets)
        }
      } catch (error) {
        console.error('Failed to load datasets:', error)
        setError('Failed to load datasets')
      }
    }
    loadDatasets()
  }, [])

  // Load sample data when dataset is selected
  const loadSampleData = async (datasetName: string) => {
    if (!datasetName) return
    
    setLoading(true)
    setError(null)
    
    try {
      let response: SampleDataResponse
      if (datasetName === 'combined') {
        response = await apiService.getCombinedSampleData(sampleLimit)
      } else {
        response = await apiService.getSampleData(datasetName, sampleLimit)
      }
      
      console.log('Dataset API response:', response)
      
      if (response.success) {
        // Check if response has 'exoplanets' field (from backend API)
        const dataArray = (response as any).exoplanets || (response as any).data || []
        console.log('Processing exoplanets:', dataArray.length, 'items')
        
        // The backend already returns properly formatted ExoplanetData objects
        const exoplanets: ExoplanetData[] = dataArray.map((item: any, index: number) => ({
          id: item.id || `${datasetName}-${index}`,
          name: item.name || `${datasetName.toUpperCase()}-${index}`,
          host_star: item.host_star || 'Unknown System',
          orbital_period: item.orbital_period || 0,
          planet_radius: item.planet_radius || 0,
          stellar_radius: item.stellar_radius || 0,
          distance_from_earth: item.distance_from_earth || 0,
          discovery_method: item.discovery_method || 'Transit',
          discovery_year: item.discovery_year || 2020,
          equilibrium_temperature: item.equilibrium_temperature || 0
        }))
        
        console.log('Processed exoplanets:', exoplanets.length)
        setSampleData(exoplanets)
      } else {
        console.error('API response unsuccessful:', response)
        setError('Failed to load sample data')
      }
    } catch (error) {
      console.error('Failed to load sample data:', error)
      setError(`Failed to load data from ${datasetName}`)
    } finally {
      setLoading(false)
    }
  }

  // Handle dataset selection
  const handleDatasetSelect = (datasetName: string) => {
    setSelectedDataset(datasetName)
    loadSampleData(datasetName)
  }

  // Filter exoplanets based on search term
  const filteredExoplanets = sampleData.filter(exoplanet =>
    exoplanet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (exoplanet.host_star?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  // Get dataset icon
  const getDatasetIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'kepler': return <Target className="w-5 h-5" />
      case 'k2': return <Satellite className="w-5 h-5" />
      case 'tess': return <Globe className="w-5 h-5" />
      default: return <Database className="w-5 h-5" />
    }
  }

  return (
    <div className="dataset-explorer">
      <div className="dataset-header">
        <div className="header-content">
          <Database className="w-8 h-8 text-blue-400" />
          <div>
            <h2>Dataset Explorer</h2>
            <p>Browse and explore NASA exoplanet datasets</p>
          </div>
        </div>
      </div>

      <div className="dataset-grid">
        {/* Dataset Selection Panel */}
        <div className="dataset-panel">
          <h3>Available Datasets</h3>
          
          {/* Combined dataset option */}
          <button
            className={`dataset-card ${selectedDataset === 'combined' ? 'selected' : ''}`}
            onClick={() => handleDatasetSelect('combined')}
          >
            <Database className="w-6 h-6 text-purple-400" />
            <div className="dataset-info">
              <h4>Combined Dataset</h4>
              <p>All NASA missions combined</p>
              <span className="dataset-source">Kepler + K2 + TESS</span>
            </div>
          </button>

          {/* Individual datasets */}
          {datasets.map((dataset) => (
            <button
              key={dataset.name}
              className={`dataset-card ${selectedDataset === dataset.name.toLowerCase() ? 'selected' : ''}`}
              onClick={() => handleDatasetSelect(dataset.name.toLowerCase())}
            >
              {getDatasetIcon(dataset.name)}
              <div className="dataset-info">
                <h4>{dataset.name} Mission</h4>
                <p>{dataset.description}</p>
                <span className="dataset-source">{dataset.telescope || 'NASA'}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Data Exploration Panel */}
        <div className="exploration-panel">
          {selectedDataset && (
            <>
              <div className="exploration-header">
                <h3>
                  {selectedDataset === 'combined' 
                    ? 'Combined Dataset' 
                    : `${selectedDataset.toUpperCase()} Dataset`
                  }
                </h3>
                
                <div className="exploration-controls">
                  <div className="search-box">
                    <Search className="w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search exoplanets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="sample-limit">
                    <label>Sample Size:</label>
                    <select
                      value={sampleLimit}
                      onChange={(e) => {
                        setSampleLimit(Number(e.target.value))
                        loadSampleData(selectedDataset)
                      }}
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={200}>200</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading && (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading {selectedDataset} data...</p>
                </div>
              )}

              {error && (
                <div className="error-state">
                  <h3>Failed to load sample data</h3>
                  <p>{error}</p>
                  <button 
                    className="retry-button"
                    onClick={() => loadSampleData(selectedDataset)}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!loading && !error && filteredExoplanets.length > 0 && (
                <div className="exoplanet-grid">
                  <div className="grid-header">
                    <h4>{filteredExoplanets.length} Exoplanets Found</h4>
                    {onExoplanetSelect && (
                      <button
                        className="visualize-btn"
                        onClick={() => onExoplanetSelect(filteredExoplanets)}
                      >
                        Visualize in 3D
                      </button>
                    )}
                  </div>

                  <div className="exoplanet-list">
                    {filteredExoplanets.map((exoplanet) => (
                      <div key={exoplanet.id} className="exoplanet-item">
                        <div className="exoplanet-header">
                          <h5>{exoplanet.name}</h5>
                          <span className="dataset-badge">
                            {(exoplanet as any).dataset_source || selectedDataset.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="exoplanet-details">
                          <div className="detail-row">
                            <span>Host Star:</span>
                            <span>{exoplanet.host_star || 'Unknown'}</span>
                          </div>
                          <div className="detail-row">
                            <span>Period:</span>
                            <span>{(exoplanet.orbital_period || 0).toFixed(2)} days</span>
                          </div>
                          <div className="detail-row">
                            <span>Radius:</span>
                            <span>{(exoplanet.planet_radius || 0).toFixed(2)} R⊕</span>
                          </div>
                          <div className="detail-row">
                            <span>Temperature:</span>
                            <span>{(exoplanet.equilibrium_temperature || 0).toFixed(0)} K</span>
                          </div>
                          <div className="detail-row">
                            <span>Discovery:</span>
                            <span>{exoplanet.discovery_year || 'Unknown'} ({exoplanet.discovery_method || 'Transit'})</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!selectedDataset && (
            <div className="no-selection">
              <Database className="w-16 h-16 text-gray-400" />
              <h3>Select a Dataset</h3>
              <p>Choose a dataset from the left panel to explore exoplanet data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DatasetExplorer