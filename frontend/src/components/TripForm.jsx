import { useState, useEffect, useRef } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || ''

function LocationInput({ label, icon, placeholder, value, onChange, id }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInput = (e) => {
    const val = e.target.value
    setQuery(val)
    onChange(val)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (val.length >= 3) {
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/autocomplete/?q=${encodeURIComponent(val)}`)
          if (res.ok) {
            const data = await res.json()
            setSuggestions(data)
            setShowDropdown(data.length > 0)
          }
        } catch {
          setSuggestions([])
        }
      }, 350)
    } else {
      setSuggestions([])
      setShowDropdown(false)
    }
  }

  const handleSelect = (suggestion) => {
    setQuery(suggestion.name)
    onChange(suggestion.name)
    setShowDropdown(false)
    setSuggestions([])
  }

  return (
    <div className="form-group" ref={wrapperRef}>
      <label htmlFor={id}>
        <span className="label-icon">{icon}</span>
        {label}
      </label>
      <input
        id={id}
        type="text"
        className="form-input"
        placeholder={placeholder}
        value={query}
        onChange={handleInput}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        autoComplete="off"
      />
      {showDropdown && (
        <div className="autocomplete-dropdown">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="autocomplete-item"
              onClick={() => handleSelect(s)}
            >
              📍 {s.name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TripForm({ onSubmit, loading }) {
  const [currentLocation, setCurrentLocation] = useState('')
  const [pickupLocation, setPickupLocation] = useState('')
  const [dropoffLocation, setDropoffLocation] = useState('')
  const [cycleUsed, setCycleUsed] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!currentLocation || !pickupLocation || !dropoffLocation) return

    onSubmit({
      current_location: currentLocation,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation,
      current_cycle_used: parseFloat(cycleUsed) || 0,
    })
  }

  return (
    <form className="glass-card trip-form-card fade-in" onSubmit={handleSubmit}>
      <h2>📋 Trip Details</h2>
      <div className="form-grid">
        <LocationInput
          id="current-location"
          label="Current Location"
          icon="📍"
          placeholder="e.g., Chicago, IL"
          value={currentLocation}
          onChange={setCurrentLocation}
        />
        <LocationInput
          id="pickup-location"
          label="Pickup Location"
          icon="📦"
          placeholder="e.g., Indianapolis, IN"
          value={pickupLocation}
          onChange={setPickupLocation}
        />
        <LocationInput
          id="dropoff-location"
          label="Drop-off Location"
          icon="🏁"
          placeholder="e.g., Los Angeles, CA"
          value={dropoffLocation}
          onChange={setDropoffLocation}
        />
        <div className="form-group">
          <label htmlFor="cycle-used">
            <span className="label-icon">⏱️</span>
            Current Cycle Used (hrs)
          </label>
          <input
            id="cycle-used"
            type="number"
            className="form-input"
            placeholder="0 – 70"
            min="0"
            max="70"
            step="0.5"
            value={cycleUsed}
            onChange={(e) => setCycleUsed(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="submit-btn"
          disabled={loading || !currentLocation || !pickupLocation || !dropoffLocation}
          id="plan-trip-btn"
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Planning Route...
            </>
          ) : (
            <>🗺️ Plan Trip & Generate Logs</>
          )}
        </button>
      </div>
    </form>
  )
}
