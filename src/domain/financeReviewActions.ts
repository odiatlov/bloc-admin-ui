import type { FinanceReportSummary } from '../types/finance'

// Server capabilities are authoritative; absent review metadata fails closed.
export const financeReviewActions = (report: FinanceReportSummary) => {
  const eligible = report.status === 'Draft' && !report.periodPublished && report.review?.isCurrent === true && report.review?.isLatestRevision === true
  return {
    publish: eligible && !!report.review?.canPublish,
    submit: eligible && !!report.review?.canSubmit,
    resubmit: eligible && !!report.review?.canResubmit,
  }
}
