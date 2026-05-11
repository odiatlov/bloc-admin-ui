import type { Resident } from '../../types/apartment'

export const residents: Resident[] = [
  { id: 'R-1001', name: 'Ana Popescu', apartmentId: 'apt-a-12', status: 'active', email: 'ana.popescu@example.com', role: 'owner' },
  { id: 'R-1002', name: 'Ion Popescu', apartmentId: 'apt-a-12', status: 'active', email: 'ion.popescu@example.com', role: 'family_member' },
  { id: 'R-1003', name: 'Mihai Ionescu', apartmentId: 'apt-a-18', status: 'active', email: 'mihai.ionescu@example.com', role: 'owner' },
  { id: 'R-1004', name: 'Maria Ionescu', apartmentId: 'apt-a-18', status: 'active', email: 'maria.ionescu@example.com', role: 'tenant' },
  { id: 'R-1005', name: 'Elena Marinescu', apartmentId: 'apt-b-41', status: 'active', email: 'elena.marinescu@example.com', role: 'owner' },
  { id: 'R-1006', name: 'Victor Stan', apartmentId: 'apt-c-72', status: 'inactive', email: 'victor.stan@example.com', role: 'owner' },
]
