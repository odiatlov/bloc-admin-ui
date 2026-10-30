export const getCurrentReadingPeriod = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

export const getReadingBaselinePeriod = (firstSubmissionPeriod: number | null): string | null => {
  if (!firstSubmissionPeriod) return null
  const baseline = new Date(Math.floor(firstSubmissionPeriod / 100), firstSubmissionPeriod % 100 - 2, 1)
  const period = Math.max(200001, baseline.getFullYear() * 100 + baseline.getMonth() + 1)
  return `${Math.floor(period / 100)}-${String(period % 100).padStart(2, '0')}`
}

export const getConsumptionStart = (blocks: ReadonlyArray<{
  id: string, firstReadingPeriod: number | null, firstSubmissionPeriod: number | null,
}>, blockId: string): string | null => {
  const starts = blocks.filter((block) => blockId === 'all' || block.id === blockId)
    .map((block) => Math.max(block.firstReadingPeriod ?? 0, block.firstSubmissionPeriod ?? 0))
    .filter((period) => period > 0)
  if (starts.length === 0) return null
  const first = Math.min(...starts)
  return `${Math.floor(first / 100)}-${String(first % 100).padStart(2, '0')}`
}

export const getReadingPeriods = (
  blocks: ReadonlyArray<{ id: string, firstReadingPeriod: number | null }>,
  blockId: string,
  now = new Date(),
) => {
  const firstPeriods = blocks.filter((block) => blockId === 'all' || block.id === blockId)
    .map((block) => block.firstReadingPeriod)
    .filter((period): period is number => period !== null)
  if (firstPeriods.length === 0) return []
  const first = Math.min(...firstPeriods)
  const firstMonth = Math.floor(first / 100) * 12 + first % 100 - 1
  const currentMonth = now.getFullYear() * 12 + now.getMonth()
  return Array.from({ length: Math.max(0, currentMonth - firstMonth + 1) }, (_, offset) => {
    const month = currentMonth - offset
    return `${Math.floor(month / 12)}-${String(month % 12 + 1).padStart(2, '0')}`
  })
}
