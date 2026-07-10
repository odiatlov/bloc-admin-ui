import type { Invoice } from '../../../../types/apartment'

export const invoices: Invoice[] = [
  { id: 'INV-2026-0501', apartmentId: 'apt-a-12', month: '2026-05', dueDate: '2026-05-05' },
  { id: 'INV-2026-0502', apartmentId: 'apt-a-18', month: '2026-05', dueDate: '2026-05-05' },
  { id: 'INV-2026-0503', apartmentId: 'apt-b-41', month: '2026-05', dueDate: '2026-05-15' },
  { id: 'INV-2026-0401', apartmentId: 'apt-a-12', month: '2026-04', dueDate: '2026-04-05' },
  { id: 'INV-2026-0402', apartmentId: 'apt-a-18', month: '2026-04', dueDate: '2026-04-05' },
]
