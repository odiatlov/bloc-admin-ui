import type { Apartment, AuthRole, Block, BuildingAdminAssignment, ResidentApartment } from '../types/apartment'

type AccountScope = {
  role: AuthRole
  adminId?: string
  residentId?: string
}

export const getAssignedBlockIds = (account: AccountScope, assignments: BuildingAdminAssignment[], residentApartments: ResidentApartment[], apartments: Apartment[]) => {
  if (account.role === 'SuperAdmin' || account.role === 'Censor') return null
  if (account.role === 'Admin') {
    return new Set(assignments.filter((assignment) => assignment.adminId === account.adminId && assignment.isActive).map((assignment) => assignment.blockId))
  }
  const apartmentIds = new Set(residentApartments.filter((link) => link.residentId === account.residentId && !link.ownershipEndDate).map((link) => link.apartmentId))
  return new Set(apartments.filter((apartment) => apartmentIds.has(apartment.id)).map((apartment) => apartment.blockId))
}

export const filterBlocksForAccount = (blocks: Block[], account: AccountScope, assignments: BuildingAdminAssignment[], residentApartments: ResidentApartment[], apartments: Apartment[]) => {
  const blockIds = getAssignedBlockIds(account, assignments, residentApartments, apartments)
  return blockIds ? blocks.filter((block) => blockIds.has(block.id)) : blocks
}

export const filterApartmentsForAccount = (apartments: Apartment[], account: AccountScope, assignments: BuildingAdminAssignment[], residentApartments: ResidentApartment[]) => {
  if (account.role === 'SuperAdmin' || account.role === 'Censor') return apartments
  if (account.role === 'Admin') {
    const blockIds = new Set(assignments.filter((assignment) => assignment.adminId === account.adminId && assignment.isActive).map((assignment) => assignment.blockId))
    return apartments.filter((apartment) => blockIds.has(apartment.blockId))
  }
  const apartmentIds = new Set(residentApartments.filter((link) => link.residentId === account.residentId && !link.ownershipEndDate).map((link) => link.apartmentId))
  return apartments.filter((apartment) => apartmentIds.has(apartment.id))
}
