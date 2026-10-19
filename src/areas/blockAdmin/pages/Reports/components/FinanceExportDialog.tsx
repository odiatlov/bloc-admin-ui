import React from 'react'
import { Alert, Box, FormControlLabel, Paper, Radio, RadioGroup, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import AppDialog from '../../../../../components/shared/AppDialog'
import { financeApi } from '../../../../../services/financeApi'
import type { FinanceExportFormat } from '../../../../../types/finance'

const FinanceExportDialog: React.FC<{ reportId: string; onClose: () => void }> = ({ reportId, onClose }) => {
  const { t, i18n } = useTranslation()
  const [format, setFormat] = React.useState<FinanceExportFormat>('maintenance-list')
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const busy = React.useRef(false)
  const download = async () => {
    if (busy.current) return
    busy.current = true; setPending(true); setError(null)
    try { await financeApi.export(reportId, i18n.language, format); onClose() }
    catch (nextError) { setError(nextError instanceof Error ? nextError.message : t('finance.billing.exportFailed')) }
    finally { busy.current = false; setPending(false) }
  }
  return <AppDialog open title={t('finance.billing.exportExcel')} cancelLabel={t('common.cancel')} confirmLabel={t(pending ? 'finance.billing.downloading' : 'finance.billing.downloadExcel')} pending={pending} onCancel={onClose} onConfirm={() => void download()} contentSx={{ display: 'grid', gap: 2 }}>
    <Typography color="text.secondary">{t('finance.billing.exportFormatHelp')}</Typography>
    <RadioGroup aria-label={t('finance.billing.reportFormat')} value={format} onChange={(_, value) => setFormat(value as FinanceExportFormat)} sx={{ gap: 1.5 }}>
      {(['maintenance-list', 'detailed'] as const).map((option) => <Paper key={option} variant="outlined" sx={{ borderColor: format === option ? 'primary.main' : 'divider' }}>
        <FormControlLabel value={option} disabled={pending} control={<Radio />} sx={{ m: 0, p: 1.5, width: '100%', alignItems: 'flex-start', boxSizing: 'border-box', '& .MuiFormControlLabel-label': { minWidth: 0, pt: 1 } }} label={<Box>
          <Typography component="span" sx={{ display: 'block', fontWeight: 700 }}>{t(`finance.billing.exportFormats.${option}.title`)}</Typography>
          <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block' }}>{t(`finance.billing.exportFormats.${option}.description`)}</Typography>
        </Box>} />
      </Paper>)}
    </RadioGroup>
    {error && <Alert severity="error">{error}</Alert>}
  </AppDialog>
}

export default FinanceExportDialog
