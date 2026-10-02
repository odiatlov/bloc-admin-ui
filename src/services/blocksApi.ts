import type {
  AssignBlockCensorRequest,
  BlockRoleAssignmentResponse,
  BlockOverviewDto,
  CreateBlockRequest,
  BlockSetupRequest,
  UpdateBlockRequest,
} from '../types/block'
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './apiClient'

export const blocksApi = {
  createSetup: (request: BlockSetupRequest) =>
    apiPost<BlockSetupRequest, BlockOverviewDto>('/blocks/setup', request),
  getOverview: () => apiGet<BlockOverviewDto[]>('/blocks/overview'),
  createBlock: (request: CreateBlockRequest) =>
    apiPost<CreateBlockRequest, BlockOverviewDto>('/blocks', request),
  updateBlock: (id: string, request: UpdateBlockRequest) =>
    apiPut<UpdateBlockRequest, BlockOverviewDto>(`/blocks/${id}`, request),
  assignCensor: (id: string, request: AssignBlockCensorRequest) =>
    apiPatch<AssignBlockCensorRequest, BlockRoleAssignmentResponse>(`/blocks/${id}/censor`, request),
  deleteBlock: (id: string) => apiDelete<string>(`/blocks/${id}`),
}

export const fetchBlockOverview = blocksApi.getOverview
