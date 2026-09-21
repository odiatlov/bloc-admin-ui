import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { formatNumber } from '../../../../../utils/formatters'
import type { IndexReading } from '../../../services/superAdminWaterApi'
import { historySegments, readingPeriod, registrationDate } from '../../../utils/meterHistory'

const MeterIndexChart = ({ readings }: { readings: IndexReading[] }) => {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
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
  const max = Math.max(1, ...sorted.map((reading) => reading.value)) * 1.1
  const left = Math.max(64, formatNumber(max).length * 8 + 12)
  const right = width - 24
  const x = (reading: IndexReading) => first === last ? (left + right) / 2
    : left + (ordinal(reading) - ordinal(first)) / (ordinal(last) - ordinal(first)) * (right - left)
  const y = (reading: IndexReading) => 216 - reading.value / max * 188
  const periodLabel = (reading: IndexReading) => new Intl.DateTimeFormat(i18n.language, { month: 'short', year: 'numeric' })
    .format(new Date(`${readingPeriod(reading)}-01T12:00:00`))
  return <Box ref={container} sx={{ minWidth: 0 }}>
    <Typography variant="subtitle1">{t('superAdmin.water.index')}</Typography>
    <Box component="svg" role="img" aria-label={t('superAdmin.water.index')} viewBox={`0 0 ${width} 260`} sx={{ display: 'block', width: '100%', height: 260, overflow: 'visible' }}>
      {[0, 0.5, 1].map((ratio) => <g key={ratio}>
        <Box component="line" x1={left} x2={right} y1={216 - ratio * 188} y2={216 - ratio * 188} stroke={theme.palette.divider} />
        <Box component="text" x={left - 8} y={220 - ratio * 188} textAnchor="end" sx={{ fill: theme.palette.text.secondary, fontSize: 12 }}>{formatNumber(max * ratio)}</Box>
      </g>)}
      {segments.map((segment) => <Box component="polyline" key={segment[0].id} points={segment.map((reading) => `${x(reading)},${y(reading)}`).join(' ')}
        fill="none" strokeWidth={2} stroke={theme.palette.primary.main} />)}
      {sorted.map((reading) => {
        const caption = `${periodLabel(reading)}: ${formatNumber(reading.value)} m\u00b3; ${t('superAdmin.water.registeredAt')}: ${registrationDate(reading.submittedAt, i18n.language)}`
        return <Tooltip key={reading.id} title={caption} describeChild>
          <Box component="circle" cx={x(reading)} cy={y(reading)} r={5} tabIndex={0} aria-label={caption}
            sx={{ fill: theme.palette.primary.main, stroke: theme.palette.background.paper, strokeWidth: 2, '&:focus': { stroke: theme.palette.text.primary, strokeWidth: 3 } }} />
        </Tooltip>
      })}
      {first === last && <Box component="text" x={x(first)} y={y(first) - 12} textAnchor="middle" sx={{ fill: theme.palette.text.primary, fontSize: 13 }}>{formatNumber(first.value)}</Box>}
      <Box component="text" x={first === last ? x(first) : left} y={245} textAnchor={first === last ? 'middle' : 'start'} sx={{ fill: theme.palette.text.secondary, fontSize: 12 }}>{periodLabel(first)}</Box>
      {first !== last && <Box component="text" x={right} y={245} textAnchor="end" sx={{ fill: theme.palette.text.secondary, fontSize: 12 }}>{periodLabel(last)}</Box>}
    </Box>
  </Box>
}

export default MeterIndexChart
