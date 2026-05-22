import type { TFunction } from 'i18next'
import type { HeatingType } from '../types/apartment'

export const translateHeatingType = (t: TFunction, heatingType: HeatingType) => t(`heatingType.${heatingType}`)
