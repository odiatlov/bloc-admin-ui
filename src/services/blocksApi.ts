import type {
  BlockOverviewDto,
  CreateBlockRequest,
  UpdateBlockRequest,
} from '../types/block'
import { apiDelete, apiGet, apiPost, apiPut } from './apiClient'

export const blocksApi = {
  getOverview: () => apiGet<BlockOverviewDto[]>('/blocks/overview'),
  createBlock: (request: CreateBlockRequest) =>
    apiPost<CreateBlockRequest, BlockOverviewDto>('/blocks', request),
  updateBlock: (id: string, request: UpdateBlockRequest) =>
    apiPut<UpdateBlockRequest, BlockOverviewDto>(`/blocks/${id}`, request),
  deleteBlock: (id: string) => apiDelete<string>(`/blocks/${id}`),
}

export const fetchBlockOverview = blocksApi.getOverview
