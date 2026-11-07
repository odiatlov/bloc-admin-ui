import { describe, expect, it } from 'vitest'
import { newApartment, newGroup } from './setupDraft'
import { applyApartmentPatch, copyCounterZoneSettings, generateCounterZones, groupWaterMeterCount } from './setupMeterDraft'
import { newWaterZone, waterZonesError } from '../../domain/waterMeterConfiguration'

describe('block setup meter generation', () => {
  it('copies the template with independent field identities while preserving apartment configurations', () => {
    const source = newGroup('A')
    const target = newGroup('B')
    source.counterGeneration[0].locationType = 'Kitchen'
    target.apartments = [{ ...newApartment('1'), hasBoiler: true, waterZones: [newWaterZone('Bathroom', 'Custom bathroom', true)] }]
    const copied = copyCounterZoneSettings([source, target], source.id)
    expect(copied[0]).toBe(source)
    expect(copied[1].counterGeneration[0].locationType).toBe('Kitchen')
    expect(copied[1].counterGeneration[0].id).not.toBe(source.counterGeneration[0].id)
    expect(copied[1].apartments).toBe(target.apartments)
    expect(target.counterGeneration[0].locationType).toBe('')
  })

  it('adds zones for this group only, respects boilers, preserves customizations and is repeatable', () => {
    const group = newGroup('A')
    const other = newGroup('B')
    group.counterGeneration[0].locationType = 'Kitchen'
    group.apartments = [newApartment('1'), { ...newApartment('2'), hasBoiler: true }]
    other.apartments = [newApartment('1')]
    const result = generateCounterZones(group, type => type)
    expect(result.error).toBeUndefined()
    const generated = result.group!
    expect(groupWaterMeterCount(generated)).toBe(3)
    expect(generated.apartments[1].waterZones[0].hotWaterCount).toBe(0)
    expect(other.apartments[0].waterZones).toEqual([])
    generated.apartments[0].waterZones[0].name = 'My kitchen'
    generated.apartments[0].waterZones[0].coldWaterCount = 2
    expect(generateCounterZones(generated, type => type).group).toBe(generated)
    expect(groupWaterMeterCount(generated)).toBe(4)
    expect(group.apartments[0].waterZones).toEqual([])
  })

  it('requires completed unique generation selections', () => {
    const group = newGroup('A')
    expect(generateCounterZones(group, type => type).error).toBe('selectCounterZones')
    group.counterGeneration = [{ id: 'one', locationType: 'Kitchen' }, { id: 'two', locationType: 'Kitchen' }]
    expect(generateCounterZones(group, type => type).error).toBe('duplicateCounterSelection')
  })

  it('clears hot meters when a boiler is enabled and keeps other apartment details', () => {
    const apartment = { ...newApartment('5'), waterZones: [newWaterZone('Kitchen', 'Kitchen')] }
    const updated = applyApartmentPatch(apartment, { hasBoiler: true })
    expect(updated.waterZones[0]).toMatchObject({ coldWaterCount: 1, hotWaterCount: 0 })
    expect(updated.id).toBe(apartment.id)
    expect(updated.number).toBe('5')
    expect(apartment.waterZones[0].hotWaterCount).toBe(1)
  })

  it('validates duplicate physical meter names, counts and boiler conflicts while permitting deferred setup', () => {
    expect(waterZonesError([], false)).toBeNull()
    const zone = newWaterZone('Bathroom', 'Bathroom')
    expect(waterZonesError([zone, { ...zone, name: 'bathroom' }], false)).toBe('duplicateMeterZone')
    expect(waterZonesError([{ ...zone, coldWaterCount: 1.5 }], false)).toBe('invalidMeterCount')
    expect(waterZonesError([zone], true)).toBe('hotWithBoiler')
    expect(waterZonesError([{ ...zone, name: 'Bad\nName' }], false)).toBe('invalidZoneName')
    expect(waterZonesError([{ ...zone, coldWaterCount: 2 }, { ...zone, name: 'Bathroom 1' }], false)).toBe('duplicateMeterZone')
  })
})
