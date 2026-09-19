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
