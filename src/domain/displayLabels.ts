import type { TFunction } from 'i18next'
import type { ApartmentSetupStatus, HeatingType, ResidentAccountStatus } from '../types/apartment'

export const translateHeatingType = (t: TFunction, heatingType: HeatingType) => t(`heatingType.${heatingType}`)
export const translateResidentAccountStatus = (t: TFunction, status: ResidentAccountStatus) => t(`status.residentAccount.${status}`)
export const translateApartmentSetupStatus = (t: TFunction, status: ApartmentSetupStatus) => t(`status.apartmentSetup.${status}`)
