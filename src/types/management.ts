import type { ApartmentSetupStatus } from './apartment'

export type StaircaseResponse = {
  id: string
  name: string
  blockId: string
  blockName: string
  apartmentCount: number
  residentCount: number
}

export type CreateStaircaseRequest = {
  blockId: string
  name: string
}

export type UpdateStaircaseRequest = CreateStaircaseRequest

export type ApartmentResponse = {
  id: string
  blockId: string
  blockName: string
  staircaseId: string | null
  staircaseName: string | null
  number: string
  residentNames: string | null
  residentCount: number
  floor: number | null
  usableSqm: number | null
  setupStatus: ApartmentSetupStatus
  hasBoiler: boolean
  createdAt: string
  updatedAt: string
}

export type CreateApartmentRequest = {
  blockId: string
  staircaseId?: string | null
  number: string
  residentCount: number
  floor?: number | null
  usableSqm?: number | null
  setupStatus?: ApartmentSetupStatus
  hasBoiler?: boolean
}

export type UpdateApartmentRequest = CreateApartmentRequest & {
  zones?: import('./waterReadings').ApartmentWaterConfigurationZone[]
}

export type PersonStatus = 'active' | 'inactive'

export type PersonApartmentSummary = {
  householdCount: number
  linkId: string
  apartmentId: string
  apartmentNumber: string
  blockId: string
  blockName: string
  staircaseId: string | null
  staircaseName: string | null
  livesHere: boolean
}

export type PersonResponse = {
  id: string
  firstName: string
  lastName: string
  fullName: string
  phone: string | null
  email: string | null
  userId: string | null
  hasRegisteredAccount: boolean
  canDeleteUnlinkedProfile: boolean
  roles: string[]
  blockRoles?: { blockId: string; blockName?: string; role: string }[]
  status: PersonStatus
  apartmentCount: number
  blocks: PersonBlockSummary[]
  adminAccounts: { adminAccountId: string; displayName: string }[]
  apartments: PersonApartmentSummary[]
  wasExistingIdentity: boolean
  createdAt: string
  updatedAt: string
}

export type PersonBlockSummary = {
  linkId: string
  blockId: string
  blockName: string
}

export type CreatePersonRequest = {
  firstName: string
  lastName: string
  invitePerson: boolean
  phone?: string | null
  email?: string | null
  userId?: string | null
  status: PersonStatus
}

export type UpdatePersonRequest = CreatePersonRequest & {
  clearBlockAssignments?: boolean
  expectedApartmentIds?: string[]
  expectedBlockIds?: string[]
  censorBlockIds?: string[]
  expectedCensorBlockIds?: string[]
}

export type UpdatePersonProfileRequest = {
  firstName: string
  lastName: string
  email: string
}

export type ApartmentResidentResponse = {
  id: string
  personId: string
  apartmentId: string
  livesHere: boolean
  personFirstName: string
  personLastName: string
  personFullName: string
  personEmail: string | null
  personPhone: string | null
  personStatus: PersonStatus
  apartmentNumber: string
  blockId: string
  blockName: string
  staircaseId: string | null
  staircaseName: string | null
  createdAt: string
  updatedAt: string
}

export type CreateApartmentResidentRequest = {
  personId: string
  livesHere: boolean
  confirmAdditionalApartment?: boolean
  expectedApartmentIds?: string[]
}

export type UpdateApartmentResidentRequest = CreateApartmentResidentRequest
