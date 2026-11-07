import { newWaterZone, waterLocationTypes, waterMeterCount } from '../../domain/waterMeterConfiguration'
import type { ApartmentDraft, Group } from './setupDraft'
import type { LayoutResult } from './setupFloorLayout'

export function copyCounterZoneSettings(groups: Group[], sourceId: string): Group[] {
  const source = groups.find(group => group.id === sourceId)
  if (!source) return groups
  return groups.map(group => group.id === sourceId ? group : {
    ...group,
    counterGeneration: source.counterGeneration.map(selection => ({ ...selection, id: crypto.randomUUID() })),
  })
}

export function generateCounterZones(group: Group, zoneName: (locationType: string) => string): LayoutResult {
  const locations = group.counterGeneration.map(zone => zone.locationType)
  if (!locations.length || locations.some(location => !waterLocationTypes.some(type => type === location))) return { error: 'selectCounterZones' }
  if (new Set(locations).size !== locations.length) return { error: 'duplicateCounterSelection' }
  let changed = false
  const apartments = group.apartments.map(apartment => {
    const waterZones = [...apartment.waterZones]
    for (const location of locations) {
      // A manually edited zone at this location already satisfies the template.
      if (waterZones.some(zone => zone.locationType === location)) continue
      waterZones.push(newWaterZone(location, zoneName(location), apartment.hasBoiler))
      changed = true
    }
    return waterZones.length === apartment.waterZones.length ? apartment : { ...apartment, waterZones }
  })
  return { group: changed ? { ...group, expanded: true, apartments } : group }
}

export const applyApartmentPatch = (apartment: ApartmentDraft, patch: Partial<ApartmentDraft>): ApartmentDraft => {
  const updated = { ...apartment, ...patch }
  return updated.hasBoiler ? { ...updated, waterZones: updated.waterZones.map(zone => ({ ...zone, hotWaterCount: 0 })) } : updated
}
export const groupWaterMeterCount = (group: Group) => group.apartments.reduce((sum, apartment) => sum + waterMeterCount(apartment.waterZones), 0)
