import type { CashPayment } from '../../../../types/apartment'

export const cashPayments: CashPayment[] = [
  { id: 'CASH-3001', apartmentId: 'apt-a-12', invoiceId: 'INV-2026-0401', amount: 100, registeredBy: 'Admin', status: 'unverified', timestamp: '2026-05-08T12:20:00', notesKey: 'finance.cash.notes.partial' },
  { id: 'CASH-3002', apartmentId: 'apt-b-41', invoiceId: 'INV-2026-0503', amount: 186, registeredBy: 'Admin', status: 'verified', timestamp: '2026-05-07T16:45:00', notesKey: 'finance.cash.notes.receipt' },
  { id: 'CASH-3003', apartmentId: 'apt-a-18', invoiceId: 'INV-2026-0402', amount: 198, registeredBy: 'Admin', status: 'deposited', timestamp: '2026-04-02T17:35:00', notesKey: 'finance.cash.notes.deposited' },
]
