import type { BlockOverview } from '../types/block'
import { apiGet } from './apiClient'

export const fetchBlockOverview = () => apiGet<BlockOverview[]>('/blocks/overview')
