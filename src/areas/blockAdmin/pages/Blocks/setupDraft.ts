export type ApartmentDraft = { id: string; number: string; floor: string; usableSqm: string; setupStatus: 'configured' | 'unconfigured'; hasBoiler: boolean }
export type GenerationSettings = { start: string; quantity: string; startingFloor: string; apartmentsPerFloor: string; usableSqm: string }
export const defaultGenerationSettings: GenerationSettings = { start: '1', quantity: '1', startingFloor: '0', apartmentsPerFloor: '1', usableSqm: '' }
export type Group = { id: string; name: string; apartments: ApartmentDraft[]; generation: GenerationSettings }
export const newApartment = (number = ''): ApartmentDraft => ({ id: crypto.randomUUID(), number, floor: '', usableSqm: '', setupStatus: 'unconfigured', hasBoiler: false })
export const newGroup = (name = ''): Group => ({ id: crypto.randomUUID(), name, apartments: [], generation: { ...defaultGenerationSettings } })
export const unique = (values: string[]) => new Set(values.map(v => v.trim().toLowerCase())).size === values.length
export const validApartment = (a: ApartmentDraft) => Boolean(a.number.trim()) && a.number.trim().length <= 50
  && (!a.floor.trim() || (Number.isInteger(Number(a.floor)) && Number(a.floor) >= -2147483648 && Number(a.floor) <= 2147483647))
  && (!a.usableSqm.trim() || (/^\d+(\.\d{1,2})?$/.test(a.usableSqm) && Number(a.usableSqm) < 1e16))

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
  if (Object.values(settings).some(value => !value.trim())) return { error: 'completeGenerationSettings' } as const
  const usableSqm = settings.usableSqm.trim()
  if (!/^\d+(\.\d{1,2})?$/.test(usableSqm) || Number(usableSqm) >= 1e16) return { error: 'usableSqmError' } as const
  const floor = Number(settings.startingFloor), perFloor = Number(settings.apartmentsPerFloor)
  if (!Number.isInteger(floor) || floor < -2147483648 || floor > 2147483647
    || !Number.isSafeInteger(perFloor) || perFloor < 1
    || floor + Math.floor((Number(settings.quantity) - 1) / perFloor) > 2147483647) return { error: 'floorDistributionError' } as const
  const result = generateBatch(Number(settings.start), Number(settings.quantity), '', group.apartments.map(apartment => apartment.number), 50)
  if (result.error) return result
  return { values: result.values.map((number, index) => ({ number, floor: String(floor + Math.floor(index / perFloor)), usableSqm })) } as const
}
