import React from 'react'
import { Alert, Box, Button, TextField, Typography } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import RefreshIcon from '@mui/icons-material/Refresh'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AppDialog from '../../../../../components/shared/AppDialog'
import { useFinanceActionScope, useFinanceIdentity } from '../../../../../hooks/useFinanceWorkspace'
import { financeReviewApi, financeReviewChanged } from '../../../../../services/financeReviewApi'
import { reviewRequestIdentity } from '../../../../../services/financeReviewRequests'
import { financeReviewError } from '../../../../../services/financeReviewErrors'
import type { FinanceReviewDetail, ReviewOutcome } from '../../../../../types/financeReview'

export default function FinanceReviewDecisions({ detail, refresh, onExport }: { detail: FinanceReviewDetail; refresh: () => void; onExport: () => void }) {
  const { t } = useTranslation()
  const identity = useFinanceIdentity()
  const active = useFinanceActionScope()
  const [outcome, setOutcome] = React.useState<ReviewOutcome | null>(null)
  const [reason, setReason] = React.useState('')
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState('')
  const busy = React.useRef(false)
  const valid = outcome === 'Approved' || outcome === 'Rejected' && reason.trim().length > 0 && reason.trim().length <= 2000
  const decide = async () => {
    if (!outcome || !valid || !detail.report.review?.canDecide || busy.current) return
    busy.current = true; setPending(true); setError('')
    const payload = { outcome, reason: outcome === 'Rejected' ? reason.trim() : null,
      expectedInputVersion: detail.report.inputVersion, expectedReviewVersion: detail.report.review.version }
    const request = reviewRequestIdentity(`${identity}:decision:${detail.submissionId}`, payload)
    try {
      await financeReviewApi.decide(detail.submissionId, { ...payload, requestId: request.id }); request.complete(); financeReviewChanged()
      if (active.current) { setOutcome(null); refresh() }
    } catch (nextError) { if (active.current) setError(financeReviewError(nextError, t)) }
    finally { busy.current = false; if (active.current) setPending(false) }
  }
  return <Box sx={{ display: 'grid', gap: 1 }}>
    {!detail.report.review?.canDecide && <Alert severity="info">{t('financeReview.decisionUnavailable')}</Alert>}
    <Box role="group" aria-label={t('financeReview.actions')} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {detail.report.review?.canDecide && <>
        <Button variant="contained" startIcon={<CheckIcon />} onClick={() => { setOutcome('Approved'); setError('') }}>{t('financeReview.approve')}</Button>
        <Button variant="outlined" color="error" startIcon={<CloseIcon />} onClick={() => { setOutcome('Rejected'); setError('') }}>{t('financeReview.reject')}</Button>
      </>}
      <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={onExport}>{t('finance.billing.exportExcel')}</Button>
      <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refresh}>{t('common.refresh')}</Button>
      <Button component={RouterLink} to="/admin/reviews" startIcon={<ArrowBackIcon />}>{t('financeReview.back')}</Button>
    </Box>
    <AppDialog open={!!outcome} title={t(outcome === 'Rejected' ? 'financeReview.reject' : 'financeReview.approve')}
      pending={pending} confirmDisabled={!valid || !detail.report.review?.canDecide} cancelLabel={t('common.cancel')}
      confirmLabel={t(outcome === 'Rejected' ? 'financeReview.reject' : 'financeReview.approve')}
      onCancel={() => { if (!pending) setOutcome(null) }} onConfirm={() => { void decide() }} contentSx={{ display: 'grid', gap: 2 }}>
      <Typography>{t('financeReview.decisionHelp', { block: detail.report.blockName, revision: detail.report.revision, cycle: detail.submission.cycle })}</Typography>
      {outcome === 'Rejected' && <TextField required fullWidth multiline minRows={3} disabled={pending} label={t('financeReview.reason')}
        value={reason} onChange={e => setReason(e.target.value)} slotProps={{ htmlInput: { maxLength: 2000 } }}
        helperText={t('financeReview.reasonLength', { count: reason.length })} />}
      {error && <Alert severity="error">{error}</Alert>}
    </AppDialog>
  </Box>
}
