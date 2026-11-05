import { useEffect, useId, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { formatNumber } from '../../utils/formatters'
import type { IndexReading } from '../../types/waterReadings'
import { historySegments, indexAxisBounds, readingPeriod, registrationDate } from '../../utils/meterHistory'

const plotTop = 28
const plotBottom = 216
const plotHeight = plotBottom - plotTop
const horizontalInset = 8

const MeterIndexChart = ({ readings }: { readings: IndexReading[] }) => {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const shadeId = useId().replace(/:/g, '')
  const container = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)
  useEffect(() => {
    if (!container.current) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)))
    observer.observe(container.current)
    return () => observer.disconnect()
  }, [])
  const segments = historySegments(readings)
  const sorted = segments.flat()
  if (!sorted.length) return null
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const ordinal = (reading: IndexReading) => reading.year * 12 + reading.month
  const { min, max } = indexAxisBounds(sorted.map((reading) => reading.value))
  const unitHeight = plotHeight / (max - min)
  const firstTick = Math.ceil(min)
  const lastTick = Math.floor(max)
  // Keep whole-unit grid lines where they fit and space out labels on wider ranges.
  const labelStep = Math.max(1, Math.ceil(16 / unitHeight))
  const labels = Array.from({ length: Math.floor((lastTick - firstTick) / labelStep) + 1 }, (_, index) => firstTick + index * labelStep)
  const showMinorGrid = labelStep > 1 && unitHeight >= 3
  const gridId = `grid-${shadeId}`
  const left = Math.max(64, formatNumber(max).length * 8 + 12)
  const right = width - 24
  const seriesLeft = left + horizontalInset
  const seriesRight = right - horizontalInset
  const x = (reading: IndexReading) => first === last ? (left + right) / 2
    : seriesLeft + (ordinal(reading) - ordinal(first)) / (ordinal(last) - ordinal(first)) * (seriesRight - seriesLeft)
  const y = (value: number) => plotBottom - (value - min) * unitHeight
  const periodLabel = (reading: IndexReading) => new Intl.DateTimeFormat(i18n.language, { month: 'short', year: 'numeric' })
    .format(new Date(`${readingPeriod(reading)}-01T12:00:00`))
  return <Box ref={container} sx={{ minWidth: 0 }}>
    <Typography variant="subtitle1">{t('meterHistory.index')}</Typography>
    <Box component="svg" role="img" aria-label={t('meterHistory.index')} viewBox={`0 0 ${width} 260`} sx={{ display: 'block', width: '100%', height: 260, overflow: 'visible' }}>
      <defs>
        <linearGradient id={shadeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
          <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0.02} />
        </linearGradient>
        {showMinorGrid && <pattern id={gridId} x={left} y={y(firstTick) - unitHeight / 2}
          width={right - left} height={unitHeight} patternUnits="userSpaceOnUse">
          <line x1={0} x2={right - left} y1={unitHeight / 2} y2={unitHeight / 2} stroke={theme.palette.divider} />
        </pattern>}
      </defs>
      {showMinorGrid && <rect x={left} y={plotTop} width={right - left} height={plotHeight} fill={`url(#${gridId})`} />}
      {labels.map((value) => <g key={value}>
        {!showMinorGrid && <line x1={left} x2={right} y1={y(value)} y2={y(value)} stroke={theme.palette.divider} />}
        <Box component="text" x={left - 8} y={y(value) + 4} textAnchor="end" sx={{ fill: theme.palette.text.secondary, fontSize: 12 }}>{formatNumber(value)}</Box>
      </g>)}
      {segments.filter((segment) => segment.length > 1).map((segment) => <polygon key={`shade-${segment[0].id}`}
        points={`${x(segment[0])},${plotBottom} ${segment.map((reading) => `${x(reading)},${y(reading.value)}`).join(' ')} ${x(segment[segment.length - 1])},${plotBottom}`}
        fill={`url(#${shadeId})`} />)}
      {segments.map((segment) => <Box component="polyline" key={segment[0].id} points={segment.map((reading) => `${x(reading)},${y(reading.value)}`).join(' ')}
        fill="none" strokeWidth={2} stroke={theme.palette.primary.main} />)}
      {sorted.map((reading) => {
        const caption = `${periodLabel(reading)}: ${formatNumber(reading.value)} m\u00b3; ${t('meterHistory.registeredAt')}: ${registrationDate(reading.submittedAt, i18n.language)}`
        return <Tooltip key={reading.id} title={caption} describeChild>
          <Box component="circle" cx={x(reading)} cy={y(reading.value)} r={5} tabIndex={0} aria-label={caption}
            sx={{ fill: theme.palette.primary.main, stroke: theme.palette.background.paper, strokeWidth: 2, '&:focus': { stroke: theme.palette.text.primary, strokeWidth: 3 } }} />
        </Tooltip>
      })}
      {first === last && <Box component="text" x={x(first)} y={y(first.value) - 12} textAnchor="middle" sx={{ fill: theme.palette.text.primary, fontSize: 13 }}>{formatNumber(first.value)}</Box>}
      <Box component="text" x={x(first)} y={245} textAnchor={first === last ? 'middle' : 'start'} sx={{ fill: theme.palette.text.secondary, fontSize: 12 }}>{periodLabel(first)}</Box>
      {first !== last && <Box component="text" x={x(last)} y={245} textAnchor="end" sx={{ fill: theme.palette.text.secondary, fontSize: 12 }}>{periodLabel(last)}</Box>}
    </Box>
  </Box>
}

export default MeterIndexChart
