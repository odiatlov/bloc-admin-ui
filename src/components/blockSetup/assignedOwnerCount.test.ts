import { describe, expect, it } from 'vitest'
import { assignedOwnerCount, newApartment } from './setupDraft'

describe('floor assigned owners', () => {
  it('counts distinct selected and completed new owners without counting occupants or blank forms', () => {
    const first = newApartment('1'); first.addResident = true; first.householdCount = '5'
    first.resident = { ...first.resident, mode: 'existing', personId: '00000000-0000-0000-0000-000000000206' }
    const second = { ...first, id: crypto.randomUUID(), number: '2' }
    const third = newApartment('3'); third.addResident = true
    const fourth = newApartment('4'); fourth.addResident = true
    fourth.resident = { ...fourth.resident, firstName: 'Ana', lastName: 'Pop' }
    expect(assignedOwnerCount([first, second, third, fourth])).toBe(2)
    expect(assignedOwnerCount([{ ...first, addResident: false }, third])).toBe(0)
  })
})
