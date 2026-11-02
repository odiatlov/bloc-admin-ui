import { describe, expect, it } from 'vitest'
import { getAssignedBlockIds } from './accessScope'

describe('external censor scope', () => {
  it('uses explicit censor appointments without any apartment assignment', () => {
    const account = { role: 'Censor' as const, blockAssignments: [
      { blockId: 'a7845fca-2096-4ba1-a54c-3f331c4d9844', role: 'Censor' },
      { blockId: '7e3a4eb9-fc2f-42fa-baf2-f0c89bf159ea', role: 'Censor' },
      { blockId: '859cf50f-f168-437f-a00b-957f33124f8a', role: 'Resident' },
    ] }
    expect(getAssignedBlockIds(account, [], [], [])).toEqual(new Set([
      'a7845fca-2096-4ba1-a54c-3f331c4d9844', '7e3a4eb9-fc2f-42fa-baf2-f0c89bf159ea',
    ]))
  })
  it('does not grant all blocks to a censor without appointments', () => {
    expect(getAssignedBlockIds({ role: 'Censor' }, [], [], [])).toEqual(new Set())
    expect(getAssignedBlockIds({ role: 'None' }, [], [], [])).toEqual(new Set())
  })
})
