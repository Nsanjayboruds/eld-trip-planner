export default function TripSummary({ summary }) {
  if (!summary) return null

  const stats = [
    { label: 'Total Days', value: summary.total_days, icon: '📅' },
    { label: 'Distance', value: `${summary.total_distance_miles.toLocaleString()} mi`, icon: '🛣️' },
    { label: 'Driving Hours', value: `${summary.total_driving_hours}h`, icon: '🚛' },
    { label: 'Rest Stops', value: summary.rest_stops, icon: '🛏️' },
    { label: 'Fuel Stops', value: summary.fuel_stops, icon: '⛽' },
    { label: 'ETA', value: new Date(summary.estimated_arrival).toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      }), icon: '🏁' },
  ]

  return (
    <div className="glass-card trip-summary-card fade-in fade-in-delay-1">
      <h2>📊 Trip Summary</h2>
      <div className="summary-grid">
        {stats.map((stat, i) => (
          <div key={i} className="summary-stat">
            <div style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
