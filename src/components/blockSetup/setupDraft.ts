export type ResidentDraft = { mode: 'new' | 'existing'; residentId: string; firstName: string; lastName: string; phone: string; email: string; inviteResident: boolean }
export type ApartmentDraft = { id: string; number: string; floor: string; usableSqm: string; setupStatus: 'configured' | 'unconfigured'; hasBoiler: boolean; householdCount: string; addResident: boolean; resident: ResidentDraft }
export type GenerationSettings = { start: string; quantity: string; startingFloor: string; apartmentsPerFloor: string; usableSqm: string }
export const defaultGenerationSettings: GenerationSettings = { start: '1', quantity: '1', startingFloor: '', apartmentsPerFloor: '', usableSqm: '' }
export type Group = { id: string; name: string; apartments: ApartmentDraft[]; generation: GenerationSettings; expanded?: boolean }
export const newApartment = (number = ''): ApartmentDraft => ({ id: crypto.randomUUID(), number, floor: '', usableSqm: '', setupStatus: 'unconfigured', hasBoiler: false,
  householdCount: '0', addResident: false, resident: { mode: 'new', residentId: '', firstName: '', lastName: '', phone: '', email: '', inviteResident: false } })
export const newGroup = (name = ''): Group => ({ id: crypto.randomUUID(), name, apartments: [], generation: { ...defaultGenerationSettings } })
export const unique = (values: string[]) => new Set(values.map(v => v.trim().toLowerCase())).size === values.length
export type ApartmentValidationField = 'number' | 'floor' | 'usableSqm' | 'setupStatus' | 'householdCount' | 'residentId' | 'firstName' | 'lastName' | 'phone' | 'email'
export type ApartmentValidationErrors = Partial<Record<ApartmentValidationField, string>>

export function apartmentValidationErrors(a: ApartmentDraft): ApartmentValidationErrors {
  const errors: ApartmentValidationErrors = {}
  if (!a.number.trim()) errors.number = 'required'
  else if (a.number.trim().length > 50) errors.number = 'numberLength'
  if (a.floor.trim() && (!Number.isInteger(Number(a.floor)) || Number(a.floor) < -2147483648 || Number(a.floor) > 2147483647)) errors.floor = 'floor'
  if (a.usableSqm.trim() && (!/^\d+(\.\d{1,2})?$/.test(a.usableSqm.trim()) || Number(a.usableSqm) >= 1e16)) errors.usableSqm = 'surface'
  if (!a.householdCount.trim()) errors.householdCount = 'required'
  else if (!Number.isInteger(Number(a.householdCount)) || Number(a.householdCount) < 0 || Number(a.householdCount) > 2147483647) errors.householdCount = 'occupants'
  if (a.setupStatus !== 'configured' && a.setupStatus !== 'unconfigured') errors.setupStatus = 'selection'
  if (!a.addResident) return errors
  if (a.resident.mode === 'existing') {
    if (!a.resident.residentId) errors.residentId = 'selection'
  } else {
    if (!a.resident.firstName.trim()) errors.firstName = 'required'
    else if (a.resident.firstName.trim().length > 100) errors.firstName = 'nameLength'
    if (!a.resident.lastName.trim()) errors.lastName = 'required'
    else if (a.resident.lastName.trim().length > 100) errors.lastName = 'nameLength'
    if (a.resident.phone.trim().length > 50) errors.phone = 'phoneLength'
  }
  if (a.resident.inviteResident && (a.resident.email.trim().length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.resident.email.trim()))) errors.email = 'email'
  return errors
}

export const validApartment = (a: ApartmentDraft) => Object.keys(apartmentValidationErrors(a)).length === 0

export function generateBatch(start: number, quantity: number, prefix: string, existing: string[], maxLength: number) {
  if (!Number.isSafeInteger(start) || start < 0 || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000 || !Number.isSafeInteger(start + quantity)) return { error: 'batchError' } as const
  const values = Array.from({ length: quantity }, (_, i) => `${prefix}${start + i}`)
  if (!unique([...existing, ...values]) || values.some(v => v.length > maxLength)) return { error: 'duplicates' } as const
  return { values } as const
}

export function generateStaircases(naming: 'alphabetical' | 'numeric', quantity: number, existing: string[]) {
  if (naming === 'numeric') return generateBatch(1, quantity, '', existing, 100)
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 26) return { error: 'alphabeticalQuantityError' } as const
  const values = Array.from({ length: quantity }, (_, index) => String.fromCharCode(65 + index))
  if (!unique([...existing, ...values])) return { error: 'duplicates' } as const
  return { values } as const
}

export function planApartmentBatch(group: Group) {
  const settings = group.generation
  if (!settings.start.trim() || !settings.quantity.trim()) return { error: 'completeGenerationSettings' } as const
  const usableSqm = settings.usableSqm.trim()
  if (usableSqm && (!/^\d+(\.\d{1,2})?$/.test(usableSqm) || Number(usableSqm) >= 1e16)) return { error: 'usableSqmError' } as const
  const floor = Number(settings.startingFloor), perFloor = Number(settings.apartmentsPerFloor)
  const hasFloor = Boolean(settings.startingFloor.trim()), hasPerFloor = Boolean(settings.apartmentsPerFloor.trim())
  if ((hasFloor && (!Number.isInteger(floor) || floor < -2147483648 || floor > 2147483647))
    || (hasPerFloor && (!hasFloor || !Number.isSafeInteger(perFloor) || perFloor < 1))
    || (hasFloor && hasPerFloor && floor + Math.floor((Number(settings.quantity) - 1) / perFloor) > 2147483647)) return { error: 'floorDistributionError' } as const
  const result = generateBatch(Number(settings.start), Number(settings.quantity), '', group.apartments.map(apartment => apartment.number), 50)
  if (result.error) return result
  return { values: result.values.map((number, index) => ({ number, floor: hasFloor && hasPerFloor ? String(floor + Math.floor(index / perFloor)) : '', usableSqm })) } as const
}
