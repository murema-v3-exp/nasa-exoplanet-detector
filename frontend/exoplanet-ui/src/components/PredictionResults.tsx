import React, { useState, useMemo } from 'react'
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts'
import { BarChart3, Target, Download, Filter, Eye, EyeOff } from 'lucide-react'
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

// Chart color schemes
const CHART_COLORS = {
  planet: '#00ff41',
  falsePositive: '#ff0080',
  confidence: '#00d4ff',
  warning: '#fbbf24'
}

// Prepare chart data
const prepareChartData = (predictions: PredictionData['predictions'], summary: PredictionData['summary']) => {
  // Pie chart data for prediction distribution
  const pieData = [
    { name: 'Planets', value: summary.predicted_planets, color: CHART_COLORS.planet },
    { name: 'False Positives', value: summary.false_positives, color: CHART_COLORS.falsePositive }
  ]

  // Confidence distribution data
  const confidenceRanges = [
    { range: '0.9-1.0', count: 0, label: 'Very High' },
    { range: '0.8-0.9', count: 0, label: 'High' },
    { range: '0.7-0.8', count: 0, label: 'Medium' },
    { range: '0.6-0.7', count: 0, label: 'Low' },
    { range: '0.0-0.6', count: 0, label: 'Very Low' }
  ]

  predictions.forEach(pred => {
    const prob = pred.probability
    if (prob >= 0.9) confidenceRanges[0].count++
    else if (prob >= 0.8) confidenceRanges[1].count++
    else if (prob >= 0.7) confidenceRanges[2].count++
    else if (prob >= 0.6) confidenceRanges[3].count++
    else confidenceRanges[4].count++
  })

  // Scatter plot data for probability vs features
  const scatterData = predictions.slice(0, 100).map(pred => ({
    probability: pred.probability,
    orbital_period: pred.features.orbital_period || 0,
    planet_radius: pred.features.planet_radius || 0,
    stellar_radius: pred.features.stellar_radius || 0,
    distance_from_earth: pred.features.distance_from_earth || 0,
    equilibrium_temperature: pred.features.equilibrium_temperature || 0,
    prediction: pred.prediction,
    id: pred.id
  }))

  return { pieData, confidenceRanges, scatterData }
}

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.dataKey}: ${entry.value}`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Charts visualization component
const ChartsVisualization: React.FC<{ 
  predictions: PredictionData['predictions']
  summary: PredictionData['summary']
  scatterXAxis: string
  scatterYAxis: string
  setScatterXAxis: (axis: string) => void
  setScatterYAxis: (axis: string) => void
}> = ({ predictions, summary, scatterXAxis, scatterYAxis, setScatterXAxis, setScatterYAxis }) => {
  const { pieData, confidenceRanges, scatterData } = useMemo(() => 
    prepareChartData(predictions, summary), [predictions, summary]
  )

  return (
    <div className="charts-container">
      <div className="charts-grid">
        {/* Prediction Distribution Pie Chart */}
        <div className="chart-section">
          <h3>// Prediction Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Confidence Distribution Bar Chart */}
        <div className="chart-section">
          <h3>// Confidence Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={confidenceRanges}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.2)" />
              <XAxis 
                dataKey="label" 
                stroke="#94a3b8"
                fontSize={12}
                fontFamily="JetBrains Mono"
              />
              <YAxis 
                stroke="#94a3b8"
                fontSize={12}
                fontFamily="JetBrains Mono"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                fill={CHART_COLORS.confidence}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Parameter Correlation Scatter Plot */}
        <div className="chart-section chart-wide">
          <div className="scatter-controls">
            <h3>// Parameter Correlation Analysis</h3>
            <div className="axis-selectors">
              <div className="selector-group">
                <label>X-Axis:</label>
                <select value={scatterXAxis} onChange={(e) => setScatterXAxis(e.target.value)}>
                  <option value="orbital_period">Orbital Period</option>
                  <option value="planet_radius">Planet Radius</option>
                  <option value="stellar_radius">Stellar Radius</option>
                  <option value="distance_from_earth">Distance from Earth</option>
                  <option value="equilibrium_temperature">Temperature</option>
                  <option value="probability">Probability</option>
                </select>
              </div>
              <div className="selector-group">
                <label>Y-Axis:</label>
                <select value={scatterYAxis} onChange={(e) => setScatterYAxis(e.target.value)}>
                  <option value="probability">Probability</option>
                  <option value="orbital_period">Orbital Period</option>
                  <option value="planet_radius">Planet Radius</option>
                  <option value="stellar_radius">Stellar Radius</option>
                  <option value="distance_from_earth">Distance from Earth</option>
                  <option value="equilibrium_temperature">Temperature</option>
                </select>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart data={scatterData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.2)" />
              <XAxis 
                type="number" 
                dataKey={scatterXAxis}
                name={getAxisLabel(scatterXAxis)}
                stroke="#94a3b8"
                fontSize={12}
                fontFamily="JetBrains Mono"
              />
              <YAxis 
                type="number" 
                dataKey={scatterYAxis}
                name={getAxisLabel(scatterYAxis)}
                stroke="#94a3b8"
                fontSize={12}
                fontFamily="JetBrains Mono"
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={<CustomTooltip />}
              />
              <Scatter 
                name="Planets" 
                data={scatterData.filter(d => d.prediction === 'PLANET')}
                fill={CHART_COLORS.planet}
              />
              <Scatter 
                name="False Positives" 
                data={scatterData.filter(d => d.prediction === 'FALSE POSITIVE')}
                fill={CHART_COLORS.falsePositive}
              />
              <Legend />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// Helper function for axis labels
const getAxisLabel = (axis: string) => {
  const labels = {
    orbital_period: 'Orbital Period (days)',
    planet_radius: 'Planet Radius (Earth radii)',
    stellar_radius: 'Stellar Radius (Solar radii)',
    distance_from_earth: 'Distance from Earth (ly)',
    equilibrium_temperature: 'Temperature (K)',
    probability: 'Probability Score'
  }
  return labels[axis as keyof typeof labels] || axis
}

const PredictionResults: React.FC<PredictionResultsProps> = ({ data }) => {
  const [view, setView] = useState<'summary' | 'detailed' | 'charts'>('summary')
  const [filter, setFilter] = useState<'all' | 'planets' | 'false_positives'>('all')
  const [showVisualization, setShowVisualization] = useState(true)
  const [scatterXAxis, setScatterXAxis] = useState('orbital_period')
  const [scatterYAxis, setScatterYAxis] = useState('probability')

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
    ].join('\n')
    
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
            {showVisualization ? 'Hide' : 'Show'} Charts
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
          <div className="card-content">
            <div className="card-icon">
              <Target size={16} />
            </div>
            <h3>{data.summary.predicted_planets}</h3>
            <span className="card-label">Planets</span>
          </div>
          <div className="tooltip">
            <h4>Potential Planets</h4>
            <p>Count: {data.summary.predicted_planets}</p>
            <p>Percentage: 53.5%</p>
            <p>High confidence detections of exoplanet candidates</p>
          </div>
        </div>
        
        <div className="summary-card false-positives">
          <div className="card-content">
            <div className="card-icon">
              <Filter size={16} />
            </div>
            <h3>{data.summary.false_positives}</h3>
            <span className="card-label">False +</span>
          </div>
          <div className="tooltip">
            <h4>False Positives</h4>
            <p>Count: {data.summary.false_positives}</p>
            <p>Percentage: 46.5%</p>
            <p>Signals that mimic planetary transits but aren't planets</p>
          </div>
        </div>
        
        <div className="summary-card confidence">
          <div className="card-content">
            <div className="card-icon">
              <Eye size={16} />
            </div>
            <h3>{Math.round((data.summary.high_confidence_count / data.total_samples) * 100)}%</h3>
            <span className="card-label">High Conf</span>
          </div>
          <div className="tooltip">
            <h4>High Confidence</h4>
            <p>Predictions {'>'}80%: {data.summary.high_confidence_count}</p>
            <p>Percentage: {Math.round((data.summary.high_confidence_count / data.total_samples) * 100)}%</p>
            <p>Detections with confidence score above 80%</p>
          </div>
        </div>
        
        <div className="summary-card average">
          <div className="card-content">
            <div className="card-icon">
              <BarChart3 size={16} />
            </div>
            <h3>{Math.round(data.summary.mean_probability * 100)}%</h3>
            <span className="card-label">Avg Prob</span>
          </div>
          <div className="tooltip">
            <h4>Mean Probability</h4>
            <p>Average: {Math.round(data.summary.mean_probability * 100)}%</p>
            <p>Model: XGBoost</p>
            <p>Average confidence across all predictions</p>
          </div>
        </div>
      </div>

      {/* Charts Visualization */}
      {showVisualization && (
        <ChartsVisualization 
          predictions={filteredPredictions} 
          summary={data.summary}
          scatterXAxis={scatterXAxis}
          scatterYAxis={scatterYAxis}
          setScatterXAxis={setScatterXAxis}
          setScatterYAxis={setScatterYAxis}
        />
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
            className={`tab ${view === 'charts' ? 'active' : ''}`}
            onClick={() => setView('charts')}
          >
            <BarChart3 size={16} />
            Charts
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

      {/* Charts View */}
      {view === 'charts' && (
        <ChartsVisualization 
          predictions={filteredPredictions} 
          summary={data.summary}
          scatterXAxis={scatterXAxis}
          scatterYAxis={scatterYAxis}
          setScatterXAxis={setScatterXAxis}
          setScatterYAxis={setScatterYAxis}
        />
      )}

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
                  {prediction.prediction === 'PLANET' ? '[PLANET]' : '[FALSE_POSITIVE]'}
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