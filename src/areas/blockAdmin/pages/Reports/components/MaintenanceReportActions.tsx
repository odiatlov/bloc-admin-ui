import { useState } from 'react'
import { Alert, Box, Button, Typography } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import PublishIcon from '@mui/icons-material/Publish'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { MaintenanceReport } from '../../../../../types/finance'
import FinancePublishDialog from './FinancePublishDialog'
import AppDialog from '../../../../../components/shared/AppDialog'
import { useFinanceActionScope, useFinanceIdentity } from '../../../../../hooks/useFinanceWorkspace'
import { financeReviewActions } from '../../../../../domain/financeReviewActions'
import { financeReviewApi, financeReviewChanged } from '../../../../../services/financeReviewApi'
import { financeReviewError } from '../../../../../services/financeReviewErrors'
import { reviewRequestIdentity } from '../../../../../services/financeReviewRequests'

type Props = { report: MaintenanceReport; onExport: () => void; onPublished: () => void }
const MaintenanceReportActions = ({ report, onExport, onPublished }: Props) => {
  const { t } = useTranslation()
  const [publishOpen, setPublishOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const identity = useFinanceIdentity()
  const active = useFinanceActionScope()
  const actions = financeReviewActions(report)
  const submit = async () => {
    if (pending || !report.review?.censorAssignmentId || !(actions.submit || actions.resubmit)) return
    setPending(true); setError('')
    const payload = { expectedInputVersion: report.inputVersion, expectedReviewVersion: report.review.version,
      expectedCensorAssignmentId: report.review.censorAssignmentId }
    const request = reviewRequestIdentity(`${identity}:submit:${report.id}`, payload)
    try {
      await financeReviewApi.submit(report.id, { ...payload, requestId: request.id }); request.complete(); financeReviewChanged()
      if (active.current) { setSubmitOpen(false); onPublished() }
    } catch (nextError) { if (active.current) setError(financeReviewError(nextError, t)) }
    finally { if (active.current) setPending(false) }
  }
  return <Box role="group" aria-label={t('financePublication.reportActions')} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
    {(actions.submit || actions.resubmit) && <Button variant="contained" startIcon={<SendIcon />} onClick={() => setSubmitOpen(true)}>
      {t(actions.resubmit ? 'financeReview.resubmit' : 'financeReview.submit')}</Button>}
    {actions.publish && <Button variant="contained" startIcon={<PublishIcon />} onClick={() => setPublishOpen(true)}>{t('financePublication.publish')}</Button>}
    <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={onExport}>{t('finance.billing.exportExcel')}</Button>
    <Button variant="text" component={RouterLink} to="/admin/reports" startIcon={<ArrowBackIcon />}>{t('finance.billing.backReports')}</Button>
    {publishOpen && <FinancePublishDialog report={report} onClose={() => setPublishOpen(false)} onPublished={() => { setPublishOpen(false); onPublished() }} />}
    <AppDialog open={submitOpen} title={t(actions.resubmit ? 'financeReview.resubmit' : 'financeReview.submit')}
      pending={pending} cancelLabel={t('common.cancel')} confirmLabel={t(actions.resubmit ? 'financeReview.resubmit' : 'financeReview.submit')}
      onCancel={() => { if (!pending) setSubmitOpen(false) }} onConfirm={() => { void submit() }}>
      <Typography>{t('financeReview.submitHelp', { block: report.blockName, revision: report.revision, period: `${report.year}-${String(report.month).padStart(2, '0')}` })}</Typography>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </AppDialog>
  </Box>
}
export default MaintenanceReportActions
