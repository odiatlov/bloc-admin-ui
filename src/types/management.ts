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
