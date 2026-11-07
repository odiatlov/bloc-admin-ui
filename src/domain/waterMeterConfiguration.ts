import type { ApartmentWaterConfigurationZone } from '../types/waterReadings'

export const waterLocationTypes = ['Kitchen', 'Bathroom', 'SecondaryBathroom', 'ServiceToilet', 'Other'] as const
export type WaterZoneDraft = ApartmentWaterConfigurationZone & { id: string }
export const newWaterZone = (locationType: string, name: string, hasBoiler = false): WaterZoneDraft => ({
  id: crypto.randomUUID(), locationType, name, coldWaterCount: 1, hotWaterCount: hasBoiler ? 0 : 1,
})
export const waterMeterCount = (zones: ApartmentWaterConfigurationZone[]) => zones.reduce((sum, zone) => sum + zone.coldWaterCount + zone.hotWaterCount, 0)
export const toWaterZones = (zones: WaterZoneDraft[], hasBoiler: boolean): ApartmentWaterConfigurationZone[] => zones.map(zone => ({
  locationType: zone.locationType, name: zone.name.trim(), coldWaterCount: zone.coldWaterCount, hotWaterCount: hasBoiler ? 0 : zone.hotWaterCount,
}))

export function waterZonesError(zones: ApartmentWaterConfigurationZone[], hasBoiler: boolean): string | null {
  const identities = new Set<string>()
  for (const zone of zones) {
    if (!waterLocationTypes.some(location => location === zone.locationType)) return 'invalidZone'
    if (!zone.name.trim() || zone.name.trim().length > 100 || /[\u0000-\u001f\u007f-\u009f]/.test(zone.name)) return 'invalidZoneName'
    if (![zone.coldWaterCount, zone.hotWaterCount].every(count => Number.isInteger(count) && count >= 0 && count <= 50)) return 'invalidMeterCount'
    if (hasBoiler && zone.hotWaterCount > 0) return 'hotWithBoiler'
    for (const [utility, count] of [['cold', zone.coldWaterCount], ['hot', zone.hotWaterCount]] as const) {
      for (let index = 1; index <= count; index++) {
        const name = count === 1 ? zone.name.trim() : `${zone.name.trim()} ${index}`
        if (name.length > 100) return 'invalidZoneName'
        const identity = `${utility}/${zone.locationType}/${name.toLowerCase()}`
        if (identities.has(identity)) return 'duplicateMeterZone'
        identities.add(identity)
      }
    }
  }
  return null
}
