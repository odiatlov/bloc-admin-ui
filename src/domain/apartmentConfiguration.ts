import type { ApartmentSetupStatus } from '../types/apartment'

export const apartmentConfigurationStatus = (surface: string | number | null, hasConsumptionZone: boolean): ApartmentSetupStatus =>
  Number.isFinite(Number(surface)) && Number(surface) > 0 && hasConsumptionZone ? 'configured' : 'unconfigured'
