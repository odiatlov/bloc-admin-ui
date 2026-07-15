import React from 'react'
import { RoleContext } from '../contexts/RoleContext'
import { fetchBlockOverview } from '../services/blocksApi'
import type { BlockOverview } from '../types/block'

type UseBlocksOptions = {
  enabled?: boolean
}

export const useBlocks = ({ enabled = true }: UseBlocksOptions = {}) => {
  const { account, role } = React.useContext(RoleContext)
  const [blocks, setBlocks] = React.useState<BlockOverview[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(enabled)
  const [search, setSearch] = React.useState('')

  const loadBlocks = React.useCallback(async () => {
    if (!enabled) {
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const nextBlocks = await fetchBlockOverview()
      setBlocks(nextBlocks)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load blocks')
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  React.useEffect(() => {
    void loadBlocks()
  }, [loadBlocks])

  const scopedBlocks = React.useMemo(() => {
    if (role !== 'Admin') return blocks
    if (!account.adminId) return []

    return blocks.filter((block) => block.adminAccountId === account.adminId)
  }, [account.adminId, blocks, role])

  const filteredBlocks = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return scopedBlocks

    return scopedBlocks.filter((block) =>
      [block.name, block.displayName, block.administratorName]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    )
  }, [scopedBlocks, search])

  return {
    blocks: filteredBlocks,
    error,
    isLoading,
    refresh: loadBlocks,
    search,
    setSearch,
  }
}
