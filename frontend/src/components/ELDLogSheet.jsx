import { useEffect, useRef } from 'react'
import { drawELDLogSheet } from '../utils/eldDrawing'

export default function ELDLogSheet({ dayLog }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !dayLog) return
    const ctx = canvasRef.current.getContext('2d')
    drawELDLogSheet(ctx, dayLog)
  }, [dayLog])

  const handleDownload = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `eld-log-day-${dayLog.day_number}-${dayLog.date}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  if (!dayLog) return null

  return (
    <div>
      <div className="eld-canvas-wrapper">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
      
      <div className="eld-hours-summary">
        <div className="eld-hours-item">
          <span className="eld-hours-dot off"></span>
          Off Duty: {(dayLog.total_hours.off_duty || 0).toFixed(1)}h
        </div>
        <div className="eld-hours-item">
          <span className="eld-hours-dot sb"></span>
          Sleeper: {(dayLog.total_hours.sleeper || 0).toFixed(1)}h
        </div>
        <div className="eld-hours-item">
          <span className="eld-hours-dot driving"></span>
          Driving: {(dayLog.total_hours.driving || 0).toFixed(1)}h
        </div>
        <div className="eld-hours-item">
          <span className="eld-hours-dot on"></span>
          On Duty: {(dayLog.total_hours.on_duty || 0).toFixed(1)}h
        </div>
      </div>
      
      <button className="eld-download-btn" onClick={handleDownload}>
        📥 Download Log (PNG)
      </button>
    </div>
  )
}
