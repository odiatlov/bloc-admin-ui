import { useState } from 'react'
import { Alert, Box, Button, TextField, Typography } from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AppDialog from '../../../../../components/shared/AppDialog'
import { useFinanceActionScope, useFinanceIdentity } from '../../../../../hooks/useFinanceWorkspace'
import { financeApi } from '../../../../../services/financeApi'
import { reviewRequestIdentity } from '../../../../../services/financeReviewRequests'
import type { MaintenanceReport } from '../../../../../types/finance'

type Props = { report: MaintenanceReport; onClose: () => void }

export default function FinanceCorrectionDialog({ report, onClose }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const identity = useFinanceIdentity()
  const active = useFinanceActionScope()
  const [reason, setReason] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)
  const generate = async () => {
    if (pending || !report.canCorrect || !report.publication || !reason.trim()) return
    setPending(true); setError(false)
    try {
      const workspace = await financeApi.workspace(report.blockId, report.year, report.month)
      if (!active.current) return
      const correction = { correctsPublicationId: report.publication.id, correctionReason: reason.trim() }
      const request = reviewRequestIdentity(`${identity}:correction:${report.id}`,
        { ...correction, expectedInputVersion: workspace.inputVersion })
      const next = await financeApi.generate(report.blockId, report.year, report.month, request.id, workspace.inputVersion, correction)
      request.complete()
      if (active.current) navigate(`/admin/reports/maintenance/${next.id}`)
    } catch { if (active.current) setError(true) }
    finally { if (active.current) setPending(false) }
  }
  return <AppDialog open title={t('financeCorrections.create')} cancelLabel={t('common.cancel')}
    confirmLabel={t('financeCorrections.generate')} pending={pending} confirmDisabled={!reason.trim() || reason.trim().length > 2000}
    onCancel={onClose} onConfirm={() => { void generate() }}>
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography>{t('financeCorrections.prepareHelp')}</Typography>
      <Button component={RouterLink} variant="text"
        to={`/admin/finance?blockId=${report.blockId}&period=${report.year}-${String(report.month).padStart(2, '0')}`}>
        {t('financeCorrections.editInputs')}
      </Button>
      <TextField label={t('financeCorrections.reason')} multiline minRows={3} value={reason} disabled={pending}
        onChange={event => setReason(event.target.value)} slotProps={{ htmlInput: { maxLength: 2000 } }} />
      <Alert severity="info">{t('financeCorrections.reviewHelp')}</Alert>
      {error && <Alert severity="error">{t('financeCorrections.generateError')}</Alert>}
    </Box>
  </AppDialog>
}
