import { generateBatch, newApartment, newFloor, planApartmentBatch, unique, type ApartmentDraft, type FloorDraft, type Group } from './setupDraft'

export type LayoutResult = { group: Group; error?: never } | { error: string; group?: never }
export type FloorSection = { floor: FloorDraft | null; apartments: ApartmentDraft[] }

export function floorLevel(value: string): number | null {
  if (!value.trim()) return null
  const level = Number(value)
  return Number.isInteger(level) && level >= -2147483648 && level <= 2147483647 ? level : null
}

export const orderedFloors = (group: Group) => [...group.floors].sort((a, b) => a.level - b.level)

export function floorSections(group: Group): FloorSection[] {
  const sections: FloorSection[] = orderedFloors(group).map(floor => ({ floor, apartments: [] }))
  const byLevel = new Map(sections.map(section => [section.floor!.level, section]))
  const unassigned: ApartmentDraft[] = []
  for (const apartment of group.apartments) {
    const level = floorLevel(apartment.floor)
    const section = level === null ? undefined : byLevel.get(level)
    if (section) section.apartments.push(apartment)
    else unassigned.push(apartment)
  }
  if (unassigned.length) sections.push({ floor: null, apartments: unassigned })
  return sections
}

export const orderedApartments = (group: Group) => floorSections(group).flatMap(section => section.apartments)

function withFloorCounts(group: Group): Group {
  const floors = orderedFloors(group)
  return { ...group, floors, generation: { ...group.generation, floorCount: String(floors.length),
    ...(floors.length ? { startingFloor: String(floors[0].level) } : {}) } }
}

function insertApartments(group: Group, additions: ApartmentDraft[]): Group {
  const numbers = [...orderedApartments(group), ...additions].map(apartment => apartment.number)
  const apartments = orderedApartments({ ...group, apartments: [...group.apartments, ...additions] })
    .map((apartment, index) => apartment.number === numbers[index] ? apartment : { ...apartment, number: numbers[index] })
  return { ...group, apartments }
}

export function appendApartmentBatch(group: Group): LayoutResult {
  const result = planApartmentBatch(group)
  if (result.error) return { error: result.error }
  const levels = new Set(group.floors.map(floor => floor.level))
  const additional = result.floors.filter(level => !levels.has(level))
  if (group.floors.length + additional.length > 1000) return { error: 'floorLimitError' }
  const floors = [...group.floors, ...additional.map((level, index) => newFloor(level, group.floors.length === 0 && index === 0))]
  return { group: insertApartments({ ...group, floors: floors.sort((a, b) => a.level - b.level) },
    result.values.map(value => ({ ...newApartment(value.number), ...value }))) }
}

export function addFloor(group: Group): LayoutResult {
  if (group.floors.length >= 1000) return { error: 'floorLimitError' }
  const level = group.floors.length ? Math.max(...group.floors.map(floor => floor.level)) + 1 : floorLevel(group.generation.startingFloor)
  if (level === null || level < -2147483648 || level > 2147483647) return { error: 'floorDistributionError' }
  return { group: withFloorCounts({ ...group, floors: [...group.floors, newFloor(level)] }) }
}

export function addApartmentToFloor(group: Group, level: number | null): LayoutResult {
  if (level !== null && !group.floors.some(floor => floor.level === level)) return { error: 'floorUnavailable' }
  const numericNumbers = group.apartments.map(apartment => apartment.number.trim()).filter(number => /^\d+$/.test(number))
    .map(Number).filter(Number.isSafeInteger)
  const configuredStart = group.generation.start.trim() ? Number(group.generation.start) : NaN
  const start = Math.max(Number.isSafeInteger(configuredStart) && configuredStart >= 0 ? configuredStart : 1, ...numericNumbers.map(number => number + 1))
  const batch = generateBatch(start, 1, '', group.apartments.map(apartment => apartment.number), 50)
  if (batch.error) return { error: batch.error }
  const apartment = { ...newApartment(batch.values[0]), floor: level === null ? '' : String(level), expanded: true }
  return { group: insertApartments({ ...group,
    floors: group.floors.map(floor => floor.level === level ? { ...floor, expanded: true } : floor),
    ...(level === null ? { unassignedExpanded: true } : {}),
    generation: { ...group.generation, quantity: String(group.apartments.length + 1) } }, [apartment]) }
}

export function moveApartment(group: Group, apartmentId: string, destination: string): LayoutResult {
  const apartment = group.apartments.find(item => item.id === apartmentId)
  if (!apartment) return { error: 'apartmentUnavailable' }
  const level = floorLevel(destination)
  if (destination.trim() && (level === null || !group.floors.some(floor => floor.level === level))) return { error: 'floorUnavailable' }
  const floorValue = level === null ? '' : String(level)
  if (apartment.floor === floorValue) return { group }
  return { group: { ...group,
    apartments: group.apartments.map(item => item.id === apartmentId ? { ...item, floor: floorValue } : item),
    floors: group.floors.map(floor => floor.level === level ? { ...floor, expanded: true } : floor),
    ...(level === null ? { unassignedExpanded: true } : {}),
  } }
}

export function deleteApartment(group: Group, apartmentId: string): LayoutResult {
  const ordered = orderedApartments(group)
  const removedIndex = ordered.findIndex(apartment => apartment.id === apartmentId)
  if (removedIndex < 0) return { error: 'apartmentUnavailable' }
  const remaining = ordered.filter(apartment => apartment.id !== apartmentId)
  // Renumber successors using the preceding labels; keep floor membership and apartment details intact.
  const apartments = remaining.map((apartment, index) => index < removedIndex ? apartment : {
    ...apartment, number: ordered[index].number,
  })
  if (!unique(apartments.map(apartment => apartment.number))) return { error: 'duplicates' }
  return { group: { ...group, apartments, generation: { ...group.generation, quantity: String(apartments.length) } } }
}

export function deleteEmptyFloor(group: Group, floorId: string): LayoutResult {
  const floor = group.floors.find(item => item.id === floorId)
  if (!floor) return { error: 'floorUnavailable' }
  if (group.apartments.some(apartment => floorLevel(apartment.floor) === floor.level)) return { error: 'floorNotEmpty' }
  return { group: withFloorCounts({ ...group,
    floors: group.floors.filter(item => item.id !== floorId).map(item => item.level > floor.level ? { ...item, level: item.level - 1 } : item),
    apartments: group.apartments.map(apartment => {
      const level = floorLevel(apartment.floor)
      return level !== null && level > floor.level ? { ...apartment, floor: String(level - 1) } : apartment
    }),
  }) }
}

export function expandApartment(group: Group, apartmentId: string): Group {
  const apartment = group.apartments.find(item => item.id === apartmentId)
  if (!apartment) return group
  const level = floorLevel(apartment.floor)
  return { ...group, expanded: true,
    floors: group.floors.map(floor => floor.level === level ? { ...floor, expanded: true } : floor),
    unassignedExpanded: true,
    apartments: group.apartments.map(item => item.id === apartmentId ? { ...item, expanded: true } : item),
  }
}
