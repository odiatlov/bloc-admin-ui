import { useTranslation } from 'react-i18next'
import StatusChip from '../../../../../components/shared/StatusChip'
import type { ResidentBillSummary } from '../../../../../types/finance'

export default function BillPaymentStatus({ bill, admin = false }: { bill: ResidentBillSummary; admin?: boolean }) {
  const { t } = useTranslation()
  if (bill.cashRequestedAt) {
    return <StatusChip status="pending" label={t(admin ? 'billPayments.cashRequested' : 'billPayments.awaitingConfirmation')} />
  }
  if (bill.status === 'credit') return <StatusChip status="approved"
    label={t((bill.availableCredit ?? 0) > 0 ? 'financeCorrections.creditStatus' : 'financeCorrections.overpaidStatus')} />
  const status = bill.status === 'overdue' ? 'unpaid' : bill.status
  return <StatusChip status={status} label={t(`residentFinance.status.${status}`)} />
}
