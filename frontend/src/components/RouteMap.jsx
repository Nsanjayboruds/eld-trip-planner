import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

function parseGeometry(geometry) {
  if (!geometry) return []
  
  if (Array.isArray(geometry)) {
    if (geometry.length > 0 && Array.isArray(geometry[0])) {
      return geometry.map(c => [c[1], c[0]])
    }
    return geometry
  }
  
  if (typeof geometry === 'string') {
    const points = []
    let index = 0, lat = 0, lng = 0

    while (index < geometry.length) {
      let shift = 0, result = 0, byte
      do {
        byte = geometry.charCodeAt(index++) - 63
        result |= (byte & 0x1f) << shift
        shift += 5
      } while (byte >= 0x20)
      lat += (result & 1) ? ~(result >> 1) : (result >> 1)

      shift = 0; result = 0
      do {
        byte = geometry.charCodeAt(index++) - 63
        result |= (byte & 0x1f) << shift
        shift += 5
      } while (byte >= 0x20)
      lng += (result & 1) ? ~(result >> 1) : (result >> 1)

      points.push([lat / 1e5, lng / 1e5])
    }
    return points
  }
  
  return []
}

function createIcon(emoji, size = 30) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<span style="font-size:${size}px">${emoji}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function FitBounds({ bounds }) {
  const map = useMap()
  
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })
    }
  }, [map, bounds])
  
  return null
}

const stopIcons = {
  pickup: '📦',
  dropoff: '🏁',
  rest: '🛏️',
  fuel: '⛽',
  break: '☕',
  restart: '🔄',
}

export default function RouteMap({ geometry, locations, stops, bbox }) {
  const routePositions = useMemo(() => parseGeometry(geometry), [geometry])
  
  const bounds = useMemo(() => {
    const pts = []
    
    if (locations?.current) pts.push([locations.current.lat, locations.current.lng])
    if (locations?.pickup) pts.push([locations.pickup.lat, locations.pickup.lng])
    if (locations?.dropoff) pts.push([locations.dropoff.lat, locations.dropoff.lng])
    
    if (routePositions.length > 0) {
      const step = Math.max(1, Math.floor(routePositions.length / 20))
      for (let i = 0; i < routePositions.length; i += step) {
        pts.push(routePositions[i])
      }
      pts.push(routePositions[routePositions.length - 1])
    }
    
    ;(stops || []).forEach(s => {
      if (s.location) pts.push([s.location.lat, s.location.lng])
    })
    
    return pts.length > 0 ? L.latLngBounds(pts) : null
  }, [locations, routePositions, stops])

  const center = bounds && bounds.isValid() 
    ? bounds.getCenter()
    : L.latLng(39.8283, -98.5795)

  return (
    <div className="glass-card map-card fade-in fade-in-delay-2">
      <h2>🗺️ Route Map</h2>
      <div className="map-container">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          {bounds && <FitBounds bounds={bounds} />}
          
          {routePositions.length > 0 && (
            <Polyline
              positions={routePositions}
              pathOptions={{
                color: '#00d4ff',
                weight: 4,
                opacity: 0.85,
              }}
            />
          )}
          
          {locations?.current && (
            <Marker
              position={[locations.current.lat, locations.current.lng]}
              icon={createIcon('🟢', 28)}
            >
              <Popup>
                <strong>Start:</strong> {locations.current.name}
              </Popup>
            </Marker>
          )}
          
          {(stops || []).map((stop, i) => {
            if (!stop.location) return null
            const icon = stopIcons[stop.type] || '📍'
            return (
              <Marker
                key={i}
                position={[stop.location.lat, stop.location.lng]}
                icon={createIcon(icon, 26)}
              >
                <Popup>
                  <strong>{stop.type.toUpperCase()}</strong>
                  <br />
                  {stop.description}
                  <br />
                  <small>Duration: {stop.duration_minutes} min</small>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}
