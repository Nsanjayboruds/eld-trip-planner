import { useState } from 'react'
import Header from './components/Header'
import TripForm from './components/TripForm'
import TripSummary from './components/TripSummary'
import RouteMap from './components/RouteMap'
import StopsList from './components/StopsList'
import ELDLogCarousel from './components/ELDLogCarousel'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function App() {
  const [tripData, setTripData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (formData) => {
    setLoading(true)
    setError(null)
    setTripData(null)

    try {
      const res = await fetch(`${API_BASE}/api/trip-plan/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Server error (${res.status})`)
      }

      const data = await res.json()
      setTripData(data)
    } catch (err) {
      setError(err.message || 'Failed to plan trip. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className="app-main">
        <TripForm onSubmit={handleSubmit} loading={loading} />

        {error && (
          <div className="error-banner fade-in">
            <span>⚠️</span> {error}
          </div>
        )}

        {loading && (
          <div className="loading-overlay fade-in">
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }}></div>
            <div className="loading-text">Planning your HOS-compliant route...</div>
            <div className="loading-bar"></div>
          </div>
        )}

        {tripData && !loading && (
          <div className="results-layout fade-in">
            <TripSummary summary={tripData.trip_summary} />
            
            <div className="map-section">
              <RouteMap
                geometry={tripData.route.geometry}
                locations={tripData.locations}
                stops={tripData.stops}
                bbox={tripData.route.bbox}
              />
            </div>

            <StopsList stops={tripData.stops} />

            <div className="logs-section">
              <ELDLogCarousel dailyLogs={tripData.daily_logs} />
            </div>
          </div>
        )}
      </main>
    </>
  )
}
