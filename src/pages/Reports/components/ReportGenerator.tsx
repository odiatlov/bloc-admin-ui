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
import { formatCurrency, formatMonth, formatNumber, useReports } from '../../../hooks/useApartmentData'

const ReportGenerator: React.FC = () => {
  const { t } = useTranslation()
  const { block, blocks, month, months, preview, setBlock, setMonth } = useReports()

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Paper sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{t('reports.filters.month')}</InputLabel>
          <Select label={t('reports.filters.month')} value={month} onChange={(event: SelectChangeEvent) => setMonth(event.target.value)}>
            {months.map((item) => (
              <MenuItem key={item} value={item}>
                {formatMonth(item)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{t('residents.filters.block')}</InputLabel>
          <Select label={t('residents.filters.block')} value={block} onChange={(event: SelectChangeEvent) => setBlock(event.target.value)}>
            <MenuItem value="all">{t('common.all')}</MenuItem>
            {blocks.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {t('common.blockValue', { block: item.name })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button startIcon={<PreviewIcon />} variant="outlined">
          {t('reports.actions.preview')}
        </Button>
        <Button startIcon={<FileDownloadIcon />} variant="contained">
          {t('reports.actions.export')}
        </Button>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t('reports.preview.title')}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(5, minmax(0, 1fr))' }, gap: 2 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t('reports.preview.invoices')}
            </Typography>
            <Typography variant="h5">{preview.invoiceCount}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t('reports.preview.revenue')}
            </Typography>
            <Typography variant="h5">{formatCurrency(preview.revenue)}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t('reports.preview.waterUsage')}
            </Typography>
            <Typography variant="h5">{formatNumber(preview.waterUsage)}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t('reports.preview.surfaceTotal')}
            </Typography>
            <Typography variant="h5">{formatNumber(preview.surfaceTotal)}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t('reports.preview.boilerTax')}
            </Typography>
            <Typography variant="h5">{formatCurrency(preview.boilerTax)}</Typography>
          </Paper>
        </Box>
      </Paper>
    </Box>
  )
}

export default ReportGenerator
