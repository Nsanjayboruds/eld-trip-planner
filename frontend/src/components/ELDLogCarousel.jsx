import { useState } from 'react'
import ELDLogSheet from './ELDLogSheet'

export default function ELDLogCarousel({ dailyLogs }) {
  const [currentDay, setCurrentDay] = useState(0)

  if (!dailyLogs || dailyLogs.length === 0) return null

  const totalDays = dailyLogs.length
  const currentLog = dailyLogs[currentDay]

  const handlePrev = () => setCurrentDay(d => Math.max(0, d - 1))
  const handleNext = () => setCurrentDay(d => Math.min(totalDays - 1, d + 1))

  const handleDownloadAll = () => {
    dailyLogs.forEach((log, idx) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      import('../utils/eldDrawing').then(({ drawELDLogSheet }) => {
        drawELDLogSheet(ctx, log)
        const link = document.createElement('a')
        link.download = `eld-log-day-${log.day_number}-${log.date}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      })
    })
  }

  return (
    <div className="glass-card eld-card fade-in fade-in-delay-3">
      <h2>📋 Daily ELD Log Sheets</h2>
      
      <div className="eld-navigation">
        <button
          className="eld-nav-btn"
          onClick={handlePrev}
          disabled={currentDay === 0}
          id="eld-prev-btn"
        >
          ← Previous Day
        </button>
        
        <span className="eld-day-label">
          Day {currentDay + 1} of {totalDays} — {new Date(currentLog.date + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
          })}
        </span>
        
        <button
          className="eld-nav-btn"
          onClick={handleNext}
          disabled={currentDay === totalDays - 1}
          id="eld-next-btn"
        >
          Next Day →
        </button>
      </div>
      
      <ELDLogSheet dayLog={currentLog} />
      
      {totalDays > 1 && (
        <button
          className="eld-download-btn"
          onClick={handleDownloadAll}
          style={{ marginTop: '0.5rem' }}
        >
          📥 Download All Logs ({totalDays} days)
        </button>
      )}
    </div>
  )
}
