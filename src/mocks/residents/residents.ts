import type { Resident, ResidentApartment } from '../../types/apartment'

export const residents: Resident[] = [
  { id: 'R-1001', name: 'Ana Popescu', status: 'active', email: 'ana.popescu@example.com', phone: '0740 100 001' },
  { id: 'R-1002', name: 'Ion Popescu', status: 'active', email: 'ion.popescu@example.com', phone: '0740 100 002' },
  { id: 'R-1003', name: 'Mihai Ionescu', status: 'active', email: 'mihai.ionescu@example.com', phone: '0740 100 003' },
  { id: 'R-1004', name: 'Maria Ionescu', status: 'active', email: 'maria.ionescu@example.com', phone: '0740 100 004' },
  { id: 'R-1005', name: 'Elena Marinescu', status: 'active', email: 'elena.marinescu@example.com', phone: '0740 100 005' },
  { id: 'R-1006', name: 'Victor Stan', status: 'inactive', email: 'victor.stan@example.com', phone: '0740 100 006' },
]

export const residentApartments: ResidentApartment[] = [
  { id: 'RA-1001-A12', residentId: 'R-1001', apartmentId: 'apt-a-12', ownershipType: 'owner', ownershipStartDate: '2019-03-01', isPrimaryResidence: true },
  { id: 'RA-1001-B41', residentId: 'R-1001', apartmentId: 'apt-b-41', ownershipType: 'co_owner', ownershipStartDate: '2024-01-15', isPrimaryResidence: false },
  { id: 'RA-1002-A12', residentId: 'R-1002', apartmentId: 'apt-a-12', ownershipType: 'family_member', ownershipStartDate: '2019-03-01', isPrimaryResidence: true },
  { id: 'RA-1003-A18', residentId: 'R-1003', apartmentId: 'apt-a-18', ownershipType: 'owner', ownershipStartDate: '2021-06-10', isPrimaryResidence: false },
  { id: 'RA-1004-A18', residentId: 'R-1004', apartmentId: 'apt-a-18', ownershipType: 'tenant', ownershipStartDate: '2025-09-01', ownershipEndDate: '2026-08-31', isPrimaryResidence: true },
  { id: 'RA-1005-B41', residentId: 'R-1005', apartmentId: 'apt-b-41', ownershipType: 'owner', ownershipStartDate: '2017-11-20', isPrimaryResidence: true },
  { id: 'RA-1006-C72', residentId: 'R-1006', apartmentId: 'apt-c-72', ownershipType: 'owner', ownershipStartDate: '2018-05-14', isPrimaryResidence: false },
]
