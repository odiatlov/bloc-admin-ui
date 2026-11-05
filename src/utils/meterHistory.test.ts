import { describe, expect, it } from 'vitest'
import { indexAxisBounds } from './meterHistory'

describe('meter index axis bounds', () => {
  it('adds one unit below the smallest reading and above the largest', () => {
    expect(indexAxisBounds([321, 325, 317])).toEqual({ min: 316, max: 326 })
    expect(indexAxisBounds([317.25, 321.75])).toEqual({ min: 316.25, max: 322.75 })
  })

  it('preserves both margins for a zero reading', () => {
    expect(indexAxisBounds([0])).toEqual({ min: -1, max: 1 })
  })
})
