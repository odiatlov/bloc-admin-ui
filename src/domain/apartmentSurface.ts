import type { Apartment } from '../types/apartment'

export type SurfaceValidationResult = {
  valid: boolean
  errors: string[]
}

export const validateApartmentSurfaces = (apartment: Pick<Apartment, 'balconySurface' | 'heatedSurface' | 'totalSurface' | 'usableSurface'>): SurfaceValidationResult => {
  const errors: string[] = []
  const balconySurface = apartment.balconySurface ?? 0

  if (apartment.usableSurface <= 0) errors.push('Usable surface must be greater than 0 sqm.')
  if (apartment.totalSurface < apartment.usableSurface) errors.push('Total surface must be greater than or equal to usable surface.')
  if (apartment.heatedSurface < 0 || apartment.heatedSurface > apartment.usableSurface) errors.push('Heated surface must be between 0 and usable surface.')
  if (balconySurface < 0) errors.push('Balcony surface cannot be negative.')
  if (apartment.usableSurface + balconySurface > apartment.totalSurface + 0.01) errors.push('Usable plus balcony surface cannot exceed total surface.')

  return { valid: errors.length === 0, errors }
}
