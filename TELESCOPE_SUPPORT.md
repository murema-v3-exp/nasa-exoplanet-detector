# Telescope-Specific Data Support

The NASA Exoplanet Hunter now supports telescope-specific data processing for
Kepler, K2, and TESS missions.

## Supported Telescopes

### 1. Kepler

-   **Dataset**: Kepler Objects of Interest (KOI)
-   **File Format**: `keppler_testset*.csv`
-   **Key Columns**:
    -   `koi_period` - Orbital Period [days]
    -   `koi_duration` - Transit Duration [hours]
    -   `koi_depth` - Transit Depth [ppm]
    -   `koi_disposition` - Classification (CONFIRMED/FALSE POSITIVE)
-   **Column Reference**: `data/Keppler_column_data.txt`

### 2. K2

-   **Dataset**: Confirmed exoplanets from K2 mission
-   **File Format**: `K2_testset*.csv`
-   **Key Columns**:
    -   `pl_orbper` - Orbital Period [days]
    -   `pl_rade` - Planet Radius [Earth Radius]
    -   `discoverymethod` - Discovery Method
    -   `disposition` - Archive Disposition
-   **Column Reference**: `data/K2_column_data.txt`

### 3. TESS

-   **Dataset**: TESS Objects of Interest (TOI)
-   **File Format**: `tess_testset*.csv`
-   **Key Columns**:
    -   `pl_orbper` - Planet Orbital Period [days]
    -   `pl_trandurh` - Planet Transit Duration [hours]
    -   `pl_trandep` - Planet Transit Depth [ppm]
    -   `tfopwg_disp` - TFOPWG Disposition
-   **Column Reference**: `data/TESS_column_data.txt`

## API Usage

### Frontend (React)

```typescript
const prediction = await apiService.predictExoplanets({
    file: csvFile,
    telescope: "kepler", // 'kepler', 'k2', or 'tess'
    model: "xgb",
    threshold: 0.5,
});
```

### Backend (FastAPI)

```bash
curl -X POST "http://localhost:8000/api/predict" \
  -F "file=@keppler_testset1.csv" \
  -F "telescope=kepler" \
  -F "model=xgb" \
  -F "threshold=0.5"
```

## Response Format

```json
{
  "success": true,
  "model_used": "xgb",
  "telescope": "Keppler",
  "threshold": 0.5,
  "total_samples": 150,
  "predictions": [...],
  "summary": {
    "predicted_planets": 12,
    "false_positives": 138,
    "mean_probability": 0.23,
    "high_confidence_count": 8
  },
  "processing_time_ms": 234.56
}
```

## Test Files Available

### Kepler Testsets

-   `keppler_testset1.csv` - `keppler_testset6.csv`

### K2 Testsets

-   `K2_testset1.csv` - `K2_testset6.csv`

### TESS Testsets

-   `tess_testset1.csv` - `tess_testset6.csv`

## Testing

Run the telescope API test suite:

```bash
python test_telescope_api.py
```

This will test each telescope type with their respective testsets and verify the
API responses.

## Column Information

Each telescope has a corresponding `{telescope}_column_data.txt` file in the
`data/` directory that describes all available columns and their meanings. This
information is used by the backend to properly process telescope-specific data
formats.
