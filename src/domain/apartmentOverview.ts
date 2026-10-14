import type { ApartmentResponse } from '../types/management'

export const getApartmentFloorOptions = (apartments: Pick<ApartmentResponse, 'staircaseId' | 'floor'>[], staircaseId: string) => {
  const floors = new Set(apartments.filter((apartment) => staircaseId === 'all' || apartment.staircaseId === staircaseId).map((apartment) => apartment.floor))
  const values = [...floors].filter((floor): floor is number => floor !== null)
    .sort((left, right) => left - right).map(String)
  return floors.has(null) ? [...values, 'unassigned'] : values
}
