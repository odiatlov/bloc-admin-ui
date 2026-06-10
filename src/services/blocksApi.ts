import type { BlockRecord } from '../types/block'
import { apiGet } from './apiClient'

export const fetchBlocks = () => apiGet<BlockRecord[]>('/blocks')
