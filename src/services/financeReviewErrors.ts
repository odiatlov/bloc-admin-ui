import type { TFunction } from 'i18next'
import { ApiError } from './apiClient'

export const financeReviewError = (error: unknown, t: TFunction) => {
  const keys: Record<string, string> = {
    CENSOR_CHANGED: 'changed', REVIEW_CHANGED: 'changed', REQUEST_ID_REUSED: 'changed',
    CENSOR_REVIEW_REQUIRED: 'required', FINANCE_BUSY: 'busy', REPORT_OUTDATED: 'outdated', REPORT_SUPERSEDED: 'outdated',
    FORBIDDEN: 'access', BLOCK_NOT_FOUND: 'access', CONCURRENT_CHANGE: 'changed',
  }
  const key = error instanceof ApiError && error.code ? keys[error.code] ?? 'failed' : 'failed'
  return t(key === 'access' ? 'financeReview.accessHelp' : `financeReview.errors.${key}`)
}
