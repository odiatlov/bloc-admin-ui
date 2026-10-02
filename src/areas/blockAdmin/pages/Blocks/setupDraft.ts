export type ApartmentDraft = { id: string; number: string; floor: string; usableSqm: string; setupStatus: 'configured' | 'unconfigured'; hasBoiler: boolean }
export type Group = { id: string; name: string; apartments: ApartmentDraft[] }
export const newApartment = (number = ''): ApartmentDraft => ({ id: crypto.randomUUID(), number, floor: '', usableSqm: '', setupStatus: 'unconfigured', hasBoiler: false })
export const newGroup = (name = ''): Group => ({ id: crypto.randomUUID(), name, apartments: [] })
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
