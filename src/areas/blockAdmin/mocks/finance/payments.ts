import type { Payment } from '../../../../types/apartment'

export const payments: Payment[] = [
  { id: 'PAY-9001', invoiceId: 'INV-2026-0502', apartmentId: 'apt-a-18', amount: 210, method: 'bank', timestamp: '2026-05-03T09:15:00', verificationStatus: 'deposited' },
  { id: 'PAY-9002', invoiceId: 'INV-2026-0402', apartmentId: 'apt-a-18', amount: 198, method: 'cash', timestamp: '2026-04-02T17:35:00', verificationStatus: 'deposited' },
  { id: 'PAY-9003', invoiceId: 'INV-2026-0401', apartmentId: 'apt-a-12', amount: 100, method: 'cash', timestamp: '2026-05-08T12:20:00', verificationStatus: 'unverified' },
]
