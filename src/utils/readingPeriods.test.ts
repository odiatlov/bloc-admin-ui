import { describe, expect, it } from 'vitest'
import { getReadingBaselinePeriod } from './readingPeriods'

describe('configured reading baseline', () => {
  it.each([
    [202609, '2026-08'],
    [202601, '2025-12'],
    [200001, '2000-01'],
    [null, null],
  ] as const)('derives the month before %s within the supported date range', (firstSubmission, expected) => {
    expect(getReadingBaselinePeriod(firstSubmission)).toBe(expected)
  })
})
