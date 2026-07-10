import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import Snackbar from '@mui/material/Snackbar'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../../components/shared/PageHeader'
import ResponsiveDataView, { type DataColumn } from '../../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../../components/shared/StatusChip'
import { blocks } from '../../../blockAdmin/mocks/blocks'
import { mockExportHistory } from '../../mocks/platformMockData'
import type { ExportFormat, ExportStatus, ExportType, PlatformExportHistoryRow } from '../../types'

const exportTypes: ExportType[] = ['all_data', 'blocks', 'residents', 'apartments', 'finance_summary']
const exportFormats: ExportFormat[] = ['csv', 'json']

const createExportPayload = (row: PlatformExportHistoryRow) => ({
  id: row.id,
  exportType: row.exportType,
  requestedBy: row.requestedBy,
  block: row.blockName ?? 'All blocks',
  format: row.format,
  status: row.status,
  createdAt: row.createdAt,
})

const downloadMockExport = (row: PlatformExportHistoryRow) => {
  const payload = createExportPayload(row)
  const content = row.format === 'json'
    ? JSON.stringify(payload, null, 2)
    : Object.keys(payload).join(',') + '\n' + Object.values(payload).join(',')
  const blob = new Blob([content], { type: row.format === 'json' ? 'application/json' : 'text/csv' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `bloc-admin-${row.exportType}.${row.format}`
  anchor.click()
  URL.revokeObjectURL(url)
}

const ExportData: React.FC = () => {
  const { t } = useTranslation()
  const [exportType, setExportType] = React.useState<ExportType>('all_data')
  const [blockId, setBlockId] = React.useState('')
  const [format, setFormat] = React.useState<ExportFormat>('csv')
  const [history, setHistory] = React.useState<PlatformExportHistoryRow[]>(mockExportHistory)
  const [snackbar, setSnackbar] = React.useState('')

  const handleGenerate = () => {
    const block = blocks.find((item) => item.id === blockId)
    const row: PlatformExportHistoryRow = {
      id: crypto.randomUUID(),
      exportType,
      requestedBy: t('superAdmin.export.requestedBy'),
      blockId: block?.id,
      blockName: block ? t('common.blockValue', { block: block.name }) : undefined,
      format,
      status: 'completed',
      createdAt: new Date().toISOString().slice(0, 10),
    }

    setHistory((current) => [row, ...current])
    downloadMockExport(row)
    setSnackbar(t('superAdmin.export.snackbar.generated'))
  }

  const statusLabel = (status: ExportStatus) => t(`superAdmin.export.status.${status}`)

  const columns: DataColumn<PlatformExportHistoryRow>[] = [
    { key: 'exportType', label: t('superAdmin.export.columns.exportType'), cardRole: 'primary', render: (row) => t(`superAdmin.export.type.${row.exportType}`) },
    { key: 'requestedBy', label: t('superAdmin.export.columns.requestedBy'), render: (row) => row.requestedBy },
    { key: 'block', label: t('superAdmin.export.columns.block'), render: (row) => row.blockName ?? t('superAdmin.export.allBlocks') },
    { key: 'format', label: t('superAdmin.export.columns.format'), render: (row) => row.format.toUpperCase() },
    {
      key: 'status',
      label: t('superAdmin.export.columns.status'),
      cardRole: 'status',
      render: (row) => <StatusChip status={row.status} label={statusLabel(row.status)} />,
    },
    { key: 'createdAt', label: t('superAdmin.common.createdAt'), render: (row) => row.createdAt },
  ]

  return (
    <Box>
      <PageHeader title={t('superAdmin.export.title')} description={t('superAdmin.export.description')} />

      <Box sx={{ display: 'grid', gap: 2 }}>
        <Paper sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, p: 2 }}>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
            <InputLabel>{t('superAdmin.export.fields.exportType')}</InputLabel>
            <Select label={t('superAdmin.export.fields.exportType')} value={exportType} onChange={(event: SelectChangeEvent) => setExportType(event.target.value as ExportType)}>
              {exportTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {t(`superAdmin.export.type.${type}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
            <InputLabel>{t('superAdmin.export.fields.block')}</InputLabel>
            <Select label={t('superAdmin.export.fields.block')} value={blockId} onChange={(event: SelectChangeEvent) => setBlockId(event.target.value)}>
              <MenuItem value="">{t('superAdmin.export.allBlocks')}</MenuItem>
              {blocks.map((block) => (
                <MenuItem key={block.id} value={block.id}>
                  {t('common.blockValue', { block: block.name })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
            <InputLabel>{t('superAdmin.export.fields.format')}</InputLabel>
            <Select label={t('superAdmin.export.fields.format')} value={format} onChange={(event: SelectChangeEvent) => setFormat(event.target.value as ExportFormat)}>
              {exportFormats.map((item) => (
                <MenuItem key={item} value={item}>
                  {item.toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button startIcon={<FileDownloadIcon />} variant="contained" onClick={handleGenerate} sx={{ minHeight: 40 }}>
            {t('superAdmin.export.actions.generate')}
          </Button>
        </Paper>

        <ResponsiveDataView
          ariaLabel={t('superAdmin.export.history')}
          columns={columns}
          desktopTableMinWidth={1000}
          getRowId={(row) => row.id}
          rows={history}
        />
      </Box>
      <Snackbar
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        open={Boolean(snackbar)}
        autoHideDuration={3000}
        message={snackbar}
        onClose={() => setSnackbar('')}
      />
    </Box>
  )
}

export default ExportData
