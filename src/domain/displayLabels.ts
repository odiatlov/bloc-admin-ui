import type { TFunction } from 'i18next'
import type { ApartmentSetupStatus, HeatingType, ResidentAccountStatus } from '../types/apartment'
import type { ResidentStatus } from '../types/management'

export const translateHeatingType = (t: TFunction, heatingType: HeatingType) => t(`heatingType.${heatingType}`)
export const translateResidentAccountStatus = (t: TFunction, status: ResidentAccountStatus) => t(`status.residentAccount.${status}`)
export const translateApartmentSetupStatus = (t: TFunction, status: ApartmentSetupStatus) => t(`status.apartmentSetup.${status}`)
export const translateResidentStatus = (t: TFunction, status: ResidentStatus) => t(`status.resident.${status}`)

export const translatePlatformUserValue = (t: TFunction, kind: 'roles' | 'statuses', value: string) =>
  t(`superAdmin.users.${kind}.${value.toLowerCase()}`, { defaultValue: t('superAdmin.users.unknown') })
