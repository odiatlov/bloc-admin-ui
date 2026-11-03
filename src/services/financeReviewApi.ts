import { apiGet, apiPost, apiPut } from './apiClient'
import type { FinanceBlock } from '../types/finance'
import type { BlockCensor, CensorCandidate, DecideReviewRequest, FinanceReviewDetail, FinanceReviewList, ReviewReceipt, SaveBlockCensor, SubmitReviewRequest } from '../types/financeReview'

export const financeReviewChanged = () => window.dispatchEvent(new Event('finance-review-changed'))
export const financeReviewApi = {
  blocks: (signal?: AbortSignal) => apiGet<FinanceBlock[]>('/finance/reviews/blocks', signal),
  periods: (blockId: string, signal?: AbortSignal) => apiGet<string[]>(`/finance/reviews/periods?${new URLSearchParams(blockId ? { blockId } : {})}`, signal),
  list: (params: { blockId?: string; year?: number; month?: number; status?: string; includeHistory: boolean; pageNumber: number }, signal?: AbortSignal) => {
    const query = new URLSearchParams({ pageSize: '10' })
    Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key, String(value)) })
    return apiGet<FinanceReviewList>(`/finance/reviews?${query}`, signal)
  },
  detail: (id: string, signal?: AbortSignal) => apiGet<FinanceReviewDetail>(`/finance/reviews/${encodeURIComponent(id)}`, signal),
  submit: (runId: string, request: SubmitReviewRequest) => apiPost<SubmitReviewRequest, ReviewReceipt>(`/finance/reports/${encodeURIComponent(runId)}/submit`, request),
  decide: (id: string, request: DecideReviewRequest) => apiPost<DecideReviewRequest, ReviewReceipt>(`/finance/reviews/${encodeURIComponent(id)}/decision`, request),
  censor: (blockId: string, signal?: AbortSignal) => apiGet<BlockCensor>(`/blocks/${encodeURIComponent(blockId)}/censor`, signal),
  candidates: (blockId: string, search: string, page: number, signal?: AbortSignal) => apiGet<{ items: CensorCandidate[]; totalCount: number }>(`/blocks/${encodeURIComponent(blockId)}/censor/candidates?${new URLSearchParams({ search, page: String(page) })}`, signal),
  saveCensor: (blockId: string, request: SaveBlockCensor) => apiPut<SaveBlockCensor, BlockCensor>(`/blocks/${encodeURIComponent(blockId)}/censor`, request),
}
