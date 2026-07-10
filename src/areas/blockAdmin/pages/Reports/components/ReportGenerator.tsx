import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import Typography from '@mui/material/Typography'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import PreviewIcon from '@mui/icons-material/Preview'
import { useTranslation } from 'react-i18next'
import FilterBar from '../../../../../components/shared/FilterBar'
import { formatCurrency, formatMonth, formatNumber, formatSquareMeters, useReports } from '../../../../../hooks/useApartmentData'
import { useBlocks } from '../../../../../hooks/useBlocks'
import { apartmentsApi } from '../../../../../services/apartmentsApi'
import type { ApartmentResponse } from '../../../../../types/management'

const ReportGenerator: React.FC = () => {
  const { t } = useTranslation()
  const { month, months, preview, setMonth } = useReports()
  const databaseBlocks = useBlocks()
  const [block, setBlock] = React.useState('all')
  const [databaseApartments, setDatabaseApartments] = React.useState<ApartmentResponse[]>([])

  React.useEffect(() => {
    let isMounted = true

    const loadApartments = async () => {
      try {
        const nextApartments = await apartmentsApi.getAll()
        if (isMounted) setDatabaseApartments(nextApartments)
      } catch {
        if (isMounted) setDatabaseApartments([])
      }
    }

    void loadApartments()

    return () => {
      isMounted = false
    }
  }, [])

  React.useEffect(() => {
    if (block === 'all') return
    if (databaseBlocks.blocks.length > 0 && !databaseBlocks.blocks.some((item) => item.id === block)) {
      setBlock('all')
    }
  }, [block, databaseBlocks.blocks])

  const surfaceTotal = React.useMemo(() => {
    if (databaseApartments.length === 0) return preview.surfaceTotal

    return databaseApartments
      .filter((apartment) => block === 'all' || apartment.blockId === block)
      .reduce((sum, apartment) => sum + (apartment.usableSqm ?? 0), 0)
  }, [block, databaseApartments, preview.surfaceTotal])

  const metrics = [
    { key: 'invoices', label: t('reports.preview.invoices'), value: preview.invoiceCount },
    { key: 'revenue', label: t('reports.preview.revenue'), value: formatCurrency(preview.revenue) },
    { key: 'waterUsage', label: t('reports.preview.waterUsage'), value: `${formatNumber(preview.waterUsage)} ${t('reports.preview.units.water')}` },
    { key: 'surfaceTotal', label: t('reports.preview.surfaceTotal'), value: formatSquareMeters(surfaceTotal) },
    { key: 'boilerTax', label: t('reports.preview.boilerTax'), value: formatCurrency(preview.boilerTax) },
  ]

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <FilterBar
        actions={(
          <>
            <Button startIcon={<PreviewIcon />} variant="outlined">
              {t('reports.actions.preview')}
            </Button>
            <Button startIcon={<FileDownloadIcon />} variant="contained">
              {t('reports.actions.export')}
            </Button>
          </>
        )}
      >
        <FormControl size="small" sx={{ minWidth: { sm: 160 } }}>
          <InputLabel>{t('reports.filters.month')}</InputLabel>
          <Select label={t('reports.filters.month')} value={month} onChange={(event: SelectChangeEvent) => setMonth(event.target.value)}>
            {months.map((item) => (
              <MenuItem key={item} value={item}>
                {formatMonth(item)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { sm: 160 } }}>
          <InputLabel>{t('residents.filters.block')}</InputLabel>
          <Select label={t('residents.filters.block')} value={block} onChange={(event: SelectChangeEvent) => setBlock(event.target.value)}>
            <MenuItem value="all">{t('common.all')}</MenuItem>
            {databaseBlocks.blocks.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {t('common.blockValue', { block: item.name })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t('reports.preview.title')}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gridAutoRows: '1fr', gap: 2 }}>
          {metrics.map((metric) => (
            <Paper key={metric.key} variant="outlined" sx={{ p: 2, minHeight: 84, display: 'grid', alignContent: 'start', gap: 0.75 }}>
              <Typography variant="body2" color="text.secondary">
                {metric.label}
              </Typography>
              <Typography variant="h5" sx={{ overflowWrap: 'anywhere', lineHeight: 1.2 }}>
                {metric.value}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Paper>
    </Box>
  )
}

export default ReportGenerator
