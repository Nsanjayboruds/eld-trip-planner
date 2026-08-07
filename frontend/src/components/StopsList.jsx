export default function StopsList({ stops }) {
  if (!stops || stops.length === 0) return null

  const typeIcons = {
    pickup: '📦',
    dropoff: '🏁',
    rest: '🛏️',
    fuel: '⛽',
    break: '☕',
    restart: '🔄',
  }

  const formatTime = (isoString) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    })
  }

  const formatDuration = (minutes) => {
    if (!minutes) return ''
    if (minutes < 60) return `${minutes} min`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  return (
    <div className="glass-card stops-card fade-in fade-in-delay-2">
      <h2>🗺️ Stops & Schedule</h2>
      <div className="stops-timeline">
        {stops.map((stop, i) => (
          <div key={i} className="stop-item">
            <div className={`stop-dot ${stop.type}`}></div>
            <div className="stop-content">
              <div className={`stop-type ${stop.type}`}>
                {typeIcons[stop.type] || '📍'} {stop.type.replace('_', ' ')}
              </div>
              <div className="stop-description">{stop.description}</div>
              <div className="stop-meta">
                {formatTime(stop.arrival_time)}
                {stop.duration_minutes ? ` · ${formatDuration(stop.duration_minutes)}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
