const CANVAS_WIDTH = 1000
const CANVAS_HEIGHT = 520

const MARGIN_LEFT = 120
const MARGIN_RIGHT = 30
const MARGIN_TOP = 80
const GRID_WIDTH = CANVAS_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
const ROW_HEIGHT = 50
const NUM_ROWS = 4
const GRID_HEIGHT = NUM_ROWS * ROW_HEIGHT
const HOURS = 24

const STATUS_CONFIG = {
  'OFF': { label: 'Off Duty', color: '#4CAF50', row: 0 },
  'SB':  { label: 'Sleeper Berth', color: '#2196F3', row: 1 },
  'D':   { label: 'Driving', color: '#f44336', row: 2 },
  'ON':  { label: 'On Duty', color: '#FF9800', row: 3 },
}

export function drawELDLogSheet(ctx, dayLog) {
  const canvas = ctx.canvas
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  
  drawHeader(ctx, dayLog)
  drawGrid(ctx)
  drawStatusLabels(ctx)
  drawTimeAxis(ctx)
  drawDutyStatusLines(ctx, dayLog.events)
  drawRemarksSection(ctx, dayLog)
  drawTotals(ctx, dayLog.total_hours)
}

function drawHeader(ctx, dayLog) {
  ctx.fillStyle = '#1a237e'
  ctx.fillRect(0, 0, CANVAS_WIDTH, 50)
  
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 16px Inter, Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('DRIVER\'S DAILY LOG', 20, 30)
  
  ctx.font = '12px Inter, Arial, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(`24 Hour Period Starting: Midnight`, CANVAS_WIDTH - 20, 20)
  
  const dateStr = dayLog.date
  const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  })
  
  ctx.fillText(`Day ${dayLog.day_number}`, CANVAS_WIDTH - 20, 38)
  
  ctx.fillStyle = '#e8eaf6'
  ctx.fillRect(0, 50, CANVAS_WIDTH, 28)
  
  ctx.fillStyle = '#1a237e'
  ctx.font = '11px Inter, Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`Date: ${formattedDate}`, 20, 67)
  
  ctx.fillText('Vehicle No: ___________', 250, 67)
  ctx.fillText('Carrier: ___________________', 460, 67)
  
  const totalMiles = Math.round(
    (dayLog.total_hours.driving || 0) * 55
  )
  ctx.textAlign = 'right'
  ctx.fillText(`Total Miles: ~${totalMiles}`, CANVAS_WIDTH - 20, 67)
}

function drawGrid(ctx) {
  const gridTop = MARGIN_TOP
  const gridLeft = MARGIN_LEFT
  
  ctx.strokeStyle = '#bdbdbd'
  ctx.lineWidth = 1
  
  ctx.strokeStyle = '#424242'
  ctx.lineWidth = 2
  ctx.strokeRect(gridLeft, gridTop, GRID_WIDTH, GRID_HEIGHT)
  
  ctx.strokeStyle = '#9e9e9e'
  ctx.lineWidth = 1
  for (let i = 1; i < NUM_ROWS; i++) {
    const y = gridTop + i * ROW_HEIGHT
    ctx.beginPath()
    ctx.moveTo(gridLeft, y)
    ctx.lineTo(gridLeft + GRID_WIDTH, y)
    ctx.stroke()
  }
  
  const hourWidth = GRID_WIDTH / HOURS
  for (let h = 1; h < HOURS; h++) {
    const x = gridLeft + h * hourWidth
    const isNoon = h === 12
    
    ctx.strokeStyle = isNoon ? '#424242' : '#bdbdbd'
    ctx.lineWidth = isNoon ? 2 : 1
    
    ctx.beginPath()
    ctx.moveTo(x, gridTop)
    ctx.lineTo(x, gridTop + GRID_HEIGHT)
    ctx.stroke()
  }
  
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 0.5
  for (let h = 0; h < HOURS; h++) {
    for (let q = 1; q < 4; q++) {
      const x = gridLeft + (h + q / 4) * hourWidth
      ctx.beginPath()
      ctx.moveTo(x, gridTop)
      ctx.lineTo(x, gridTop + GRID_HEIGHT)
      ctx.stroke()
    }
  }
}

function drawStatusLabels(ctx) {
  const gridTop = MARGIN_TOP
  
  const labels = [
    { text: 'OFF DUTY', shortText: '1', row: 0 },
    { text: 'SLEEPER', shortText: '2', row: 1 },
    { text: 'DRIVING', shortText: '3', row: 2 },
    { text: 'ON DUTY', shortText: '4', row: 3 },
  ]
  
  labels.forEach(({ text, shortText, row }) => {
    const y = gridTop + row * ROW_HEIGHT + ROW_HEIGHT / 2
    
    ctx.fillStyle = '#1a237e'
    ctx.font = 'bold 12px Inter, Arial, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(shortText + '.', 25, y + 4)
    
    ctx.fillStyle = '#333333'
    ctx.font = '11px Inter, Arial, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(text, 32, y + 4)
    
    const config = Object.values(STATUS_CONFIG).find(c => c.row === row)
    if (config) {
      ctx.fillStyle = config.color
      ctx.fillRect(105, y - 6, 10, 12)
    }
  })
}

function drawTimeAxis(ctx) {
  const gridTop = MARGIN_TOP
  const gridLeft = MARGIN_LEFT
  const hourWidth = GRID_WIDTH / HOURS
  const yTop = gridTop - 5
  const yBottom = gridTop + GRID_HEIGHT + 15
  
  ctx.fillStyle = '#424242'
  ctx.font = '10px Inter, Arial, sans-serif'
  ctx.textAlign = 'center'
  
  for (let h = 0; h <= HOURS; h++) {
    const x = gridLeft + h * hourWidth
    let label
    
    if (h === 0 || h === 24) label = 'M'
    else if (h === 12) label = 'N'
    else if (h <= 12) label = String(h)
    else label = String(h - 12)
    
    ctx.fillText(label, x, yTop)
    ctx.fillText(label, x, yBottom)
  }
  
  ctx.font = '9px Inter, Arial, sans-serif'
  ctx.fillStyle = '#757575'
  ctx.fillText('AM', gridLeft + 6 * hourWidth, yTop - 10)
  ctx.fillText('PM', gridLeft + 18 * hourWidth, yTop - 10)
}

function drawDutyStatusLines(ctx, events) {
  if (!events || events.length === 0) return
  
  const gridTop = MARGIN_TOP
  const gridLeft = MARGIN_LEFT
  const hourWidth = GRID_WIDTH / HOURS
  
  function getStatusY(status) {
    const config = STATUS_CONFIG[status]
    if (!config) return gridTop + ROW_HEIGHT / 2
    return gridTop + config.row * ROW_HEIGHT + ROW_HEIGHT / 2
  }
  
  function getStatusColor(status) {
    const config = STATUS_CONFIG[status]
    return config ? config.color : '#333333'
  }
  
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    const startX = gridLeft + event.start_hour * hourWidth
    const endX = gridLeft + event.end_hour * hourWidth
    const y = getStatusY(event.status)
    const color = getStatusColor(event.status)
    
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(startX, y)
    ctx.lineTo(endX, y)
    ctx.stroke()
    
    if (i < events.length - 1) {
      const nextEvent = events[i + 1]
      const nextY = getStatusY(nextEvent.status)
      
      if (Math.abs(y - nextY) > 1) {
        ctx.strokeStyle = '#333333'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(endX, y)
        ctx.lineTo(endX, nextY)
        ctx.stroke()
      }
    }
  }
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    const startX = gridLeft + event.start_hour * hourWidth
    const y = getStatusY(event.status)
    
    if (i > 0) {
      ctx.fillStyle = '#333333'
      ctx.beginPath()
      ctx.arc(startX, y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawRemarksSection(ctx, dayLog) {
  const remarksTop = MARGIN_TOP + GRID_HEIGHT + 30
  
  ctx.fillStyle = '#424242'
  ctx.font = 'bold 11px Inter, Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('REMARKS:', 20, remarksTop)
  
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 0.5
  
  const remarks = dayLog.remarks || []
  const lineY = remarksTop + 5
  
  ctx.font = '10px Inter, Arial, sans-serif'
  ctx.fillStyle = '#555555'
  
  const displayRemarks = remarks.slice(0, 3)
  displayRemarks.forEach((remark, i) => {
    const y = lineY + (i + 1) * 18
    ctx.fillText(`${remark.time} - ${remark.text}`, 30, y)
    
    ctx.beginPath()
    ctx.moveTo(20, y + 4)
    ctx.lineTo(CANVAS_WIDTH - 20, y + 4)
    ctx.stroke()
  })
  
  for (let i = displayRemarks.length; i < 3; i++) {
    const y = lineY + (i + 1) * 18
    ctx.beginPath()
    ctx.moveTo(20, y + 4)
    ctx.lineTo(CANVAS_WIDTH - 20, y + 4)
    ctx.stroke()
  }
}

function drawTotals(ctx, totalHours) {
  const totalsTop = CANVAS_HEIGHT - 55
  
  ctx.fillStyle = '#e8eaf6'
  ctx.fillRect(0, totalsTop - 5, CANVAS_WIDTH, 50)
  
  ctx.strokeStyle = '#9e9e9e'
  ctx.lineWidth = 1
  ctx.strokeRect(0, totalsTop - 5, CANVAS_WIDTH, 50)
  
  ctx.font = 'bold 11px Inter, Arial, sans-serif'
  ctx.fillStyle = '#1a237e'
  ctx.textAlign = 'left'
  ctx.fillText('TOTAL HOURS:', 20, totalsTop + 14)
  
  const items = [
    { label: 'Off Duty', value: totalHours.off_duty || 0, color: '#4CAF50' },
    { label: 'Sleeper', value: totalHours.sleeper || 0, color: '#2196F3' },
    { label: 'Driving', value: totalHours.driving || 0, color: '#f44336' },
    { label: 'On Duty', value: totalHours.on_duty || 0, color: '#FF9800' },
  ]
  
  let x = 140
  items.forEach(item => {
    ctx.fillStyle = item.color
    ctx.beginPath()
    ctx.arc(x, totalsTop + 11, 5, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#333333'
    ctx.font = '10px Inter, Arial, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`${item.label}:`, x + 10, totalsTop + 14)
    
    ctx.font = 'bold 13px Inter, Arial, sans-serif'
    ctx.fillStyle = '#1a237e'
    ctx.fillText(item.value.toFixed(1), x + 10, totalsTop + 32)
    
    x += 130
  })
  
  const total = items.reduce((sum, item) => sum + item.value, 0)
  ctx.font = 'bold 12px Inter, Arial, sans-serif'
  ctx.fillStyle = '#1a237e'
  ctx.textAlign = 'right'
  ctx.fillText(`TOTAL: ${total.toFixed(1)} hrs`, CANVAS_WIDTH - 20, totalsTop + 24)
}
