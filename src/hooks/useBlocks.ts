import React from 'react'
import { fetchBlocks } from '../services/blocksApi'
import type { BlockRecord } from '../types/block'

type UseBlocksOptions = {
  enabled?: boolean
}

export const useBlocks = ({ enabled = true }: UseBlocksOptions = {}) => {
  const [blocks, setBlocks] = React.useState<BlockRecord[]>([])
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
      const nextBlocks = await fetchBlocks()
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

  const filteredBlocks = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return blocks

    return blocks.filter((block) =>
      [block.name, block.address]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    )
  }, [blocks, search])

  return {
    blocks: filteredBlocks,
    error,
    isLoading,
    refresh: loadBlocks,
    search,
    setSearch,
  }
}
