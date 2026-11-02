import React from 'react'
import { usePageFilter } from './usePageFilter'
import { RoleContext } from '../contexts/RoleContext'
import { fetchBlockOverview } from '../services/blocksApi'
import type { BlockOverview } from '../types/block'

type UseBlocksOptions = {
  enabled?: boolean
  filterSearch?: boolean
}

export const useBlocks = ({ enabled = true, filterSearch = true }: UseBlocksOptions = {}) => {
  const { account, role } = React.useContext(RoleContext)
  const scopeKey = `${account.id}:${role}`
  const [loadedScope, setLoadedScope] = React.useState(scopeKey)
  const requestSequence = React.useRef(0)
  const [blocks, setBlocks] = React.useState<BlockOverview[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(enabled)
  const [search, setSearch] = usePageFilter('blocks.search', '')

  const loadBlocks = React.useCallback(async () => {
    if (!enabled) {
      setIsLoading(false)
      setError(null)
      return true
    }

    const sequence = ++requestSequence.current
    setLoadedScope(scopeKey)
    setIsLoading(true)
    setError(null)
    setBlocks([])

    try {
      const nextBlocks = await fetchBlockOverview(role)
      if (sequence !== requestSequence.current) return false
      setBlocks(nextBlocks)
      return true
    } catch (nextError) {
      if (sequence !== requestSequence.current) return false
      setError(nextError instanceof Error ? nextError.message : 'Unable to load blocks')
      return false
    } finally {
      if (sequence === requestSequence.current) setIsLoading(false)
    }
  }, [enabled, scopeKey, role])

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBlocks()
    }, 0)

    return () => { window.clearTimeout(timer); requestSequence.current += 1 }
  }, [loadBlocks])

  const scopedBlocks = React.useMemo(() => {
    if (role !== 'Admin') return blocks
    if (!account.adminId) return []

    return blocks.filter((block) => block.adminAccountId === account.adminId)
  }, [account.adminId, blocks, role])

  const filteredBlocks = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!filterSearch || !query) return scopedBlocks

    return scopedBlocks.filter((block) =>
      [block.name, block.displayName, block.administratorName]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    )
  }, [scopedBlocks, search, filterSearch])

  return {
    blocks: loadedScope === scopeKey ? filteredBlocks : [],
    totalBlocks: loadedScope === scopeKey ? scopedBlocks.length : 0,
    error: loadedScope === scopeKey ? error : null,
    isLoading: isLoading || (enabled && loadedScope !== scopeKey),
    refresh: loadBlocks,
    search,
    setSearch,
  }
}
