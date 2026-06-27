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
  familyName: string | null
  residentCount: number
  floor: number | null
  usableSqm: number | null
  setupStatus: ApartmentSetupStatus
  createdAt: string
  updatedAt: string
}

export type CreateApartmentRequest = {
  blockId: string
  staircaseId?: string | null
  number: string
  familyName?: string | null
  residentCount: number
  floor?: number | null
  usableSqm?: number | null
  setupStatus: ApartmentSetupStatus
}

export type UpdateApartmentRequest = CreateApartmentRequest

export type ResidentStatus = 'active' | 'inactive'

export type ResidentApartmentSummary = {
  linkId: string
  apartmentId: string
  apartmentNumber: string
  blockId: string
  blockName: string
  staircaseId: string | null
  staircaseName: string | null
  livesHere: boolean
}

export type ResidentResponse = {
  id: string
  firstName: string
  lastName: string
  fullName: string
  phone: string | null
  email: string | null
  userId: string | null
  status: ResidentStatus
  apartmentCount: number
  apartments: ResidentApartmentSummary[]
  createdAt: string
  updatedAt: string
}

export type CreateResidentRequest = {
  firstName: string
  lastName: string
  phone?: string | null
  email?: string | null
  userId?: string | null
  status: ResidentStatus
}

export type UpdateResidentRequest = CreateResidentRequest

export type ApartmentResidentResponse = {
  id: string
  residentId: string
  apartmentId: string
  livesHere: boolean
  residentFirstName: string
  residentLastName: string
  residentFullName: string
  residentEmail: string | null
  residentPhone: string | null
  residentStatus: ResidentStatus
  apartmentNumber: string
  blockId: string
  blockName: string
  staircaseId: string | null
  staircaseName: string | null
  createdAt: string
  updatedAt: string
}

export type CreateApartmentResidentRequest = {
  residentId: string
  livesHere: boolean
}

export type UpdateApartmentResidentRequest = CreateApartmentResidentRequest
