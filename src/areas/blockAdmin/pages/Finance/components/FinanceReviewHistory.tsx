import { Alert, Box, Chip, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import ResponsiveDataView, { type DataColumn } from '../../../../../components/shared/ResponsiveDataView'
import type { FinanceReviewCycle, FinanceReviewState } from '../../../../../types/financeReview'

export const FinanceReviewStatus = ({ review }: { review?: Pick<FinanceReviewState, 'status'> }) => {
  const { t } = useTranslation()
  if (!review) return null
  return <Chip size="small" color={review.status === 'Approved' ? 'success' : review.status === 'Rejected' ? 'error' : 'default'}
    label={t(`financeReview.status.${review.status}`)} />
}

export default function FinanceReviewHistory({ review, published = false, submissionId, publicationPath }: { review?: FinanceReviewState; published?: boolean; submissionId?: string; publicationPath?: string }) {
  const { t, i18n } = useTranslation()
  const [search] = useSearchParams()
  if (!review) return null
  const selected = review.history.find(x => x.id === (submissionId ?? search.get('submissionId')))
  const columns: DataColumn<FinanceReviewCycle>[] = [
    { key: 'cycle', label: t('financeReview.cycle'), cardRole: 'primary', render: x => x.cycle },
    { key: 'revision', label: t('finance.billing.revisionLabel'), render: x => x.revision },
    { key: 'status', label: t('finance.billing.status'), cardRole: 'status', render: x => <FinanceReviewStatus review={{ status: x.status }} /> },
    { key: 'at', label: t('financeReview.submittedAt'), render: x => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(x.submittedAt)) },
    { key: 'decisionAt', label: t('financeReview.decidedAt'), render: x => x.decidedAt ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(x.decidedAt)) : '—' },
    { key: 'reason', label: t('financeReview.reason'), cardRole: 'secondary', render: x => <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{x.reason || '—'}</Typography> },
  ]
  return <Box sx={{ display: 'grid', gap: 1.5 }}>
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}><Typography variant="h6">{t('financeReview.history')}</Typography><FinanceReviewStatus review={review} /></Box>
    <Alert severity="info">{t(published ? 'financeReview.publishedHelp' : review.censorRequired ? 'financeReview.requiredHelp' : 'financeReview.directHelp')}</Alert>
    {published && publicationPath && ['BeforeCensorWorkflow', 'DirectWithoutCensor', 'Reviewed'].includes(publicationPath)
      && <Typography variant="body2" color="text.secondary">{t(`financeReview.publicationPaths.${publicationPath}`)}</Typography>}
    {selected && <Alert severity={selected.status === 'Rejected' ? 'warning' : 'info'}>
      {t('financeReview.linkedCycle', { cycle: selected.cycle, revision: selected.revision })}
      <Typography>{t(`financeReview.status.${selected.status}`)}</Typography>
      {selected.reason && <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{selected.reason}</Typography>}
    </Alert>}
    {review.history.length > 0 && <ResponsiveDataView paginationId="finance-review-history" ariaLabel={t('financeReview.history')}
      rows={review.history} columns={columns} getRowId={x => x.id} />}
  </Box>
}
