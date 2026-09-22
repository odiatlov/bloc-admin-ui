import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import StatusChip from '../shared/StatusChip'
import type { DataColumn } from '../shared/ResponsiveDataView'
import type { WaterConsumptionData } from '../../types/waterReadings'
import { formatNumber as format } from '../../utils/formatters'

const chipStatus: Record<WaterConsumptionData['status'], string> = {
  complete: 'completed', incomplete: 'warning', noMeters: 'critical', invalid: 'critical',
}

export const useConsumptionColumns = <Row extends WaterConsumptionData = WaterConsumptionData,>(period: string) => {
  const { t, i18n } = useTranslation()
  const apartmentLabel = (row: Row) => [
    t('consumption.location.apartmentValue', { apartment: row.apartment.number }),
    row.apartment.staircaseName && t('consumption.location.staircaseValue', { staircase: row.apartment.staircaseName }),
  ].filter(Boolean).join(' - ')
  const renderMeters = (row: Row, utility: string) => {
    const meters = row.meters.filter((meter) => meter.utilityType === utility)
    return meters.length === 0 ? '-' : <Box sx={{ display: 'grid', gap: 0.5 }}>{meters.map((meter) => (
      <Typography key={meter.id} variant="body2">
        {meter.name}: {t('consumption.columns.meterValue', {
          previous: meter.previous === null ? '-' : format(meter.previous),
          current: meter.current === null ? '-' : format(meter.current),
          usage: meter.usage === null ? '-' : `${format(meter.usage)} m\u00b3`,
        })}
      </Typography>
    ))}</Box>
  }
  const columns: DataColumn<Row>[] = [
    { key: 'apartment', label: t('consumption.columns.apartment'), cardRole: 'primary', render: apartmentLabel },
    { key: 'block', label: t('residents.filters.block'), render: (row) => row.apartment.blockName },
    { key: 'month', label: t('finance.columns.month'), render: () => new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(new Date(`${period}-01T12:00:00`)) },
    { key: 'cold', label: t('consumption.waterType.cold'), render: (row) => renderMeters(row, 'ColdWater') },
    { key: 'hot', label: t('consumption.waterType.hot'), render: (row) => renderMeters(row, 'HotWater') },
    { key: 'total', label: `${t('consumption.columns.totalUsage')} (m\u00b3)`, render: (row) => row.usage === null ? '-' : format(row.usage) },
    { key: 'status', label: t('consumption.columns.status'), cardRole: 'status', render: (row) => <StatusChip status={chipStatus[row.status]} label={t(`consumption.report.${row.status}`)} /> },
  ]
  return { columns, apartmentLabel }
}
