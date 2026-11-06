import Stack from '@mui/material/Stack'
import { useTranslation } from 'react-i18next'
import StatusChip from '../../../../../components/shared/StatusChip'
import type { ResidentBillSummary } from '../../../../../types/finance'

export default function BillPaymentStatus({ bill, admin = false }: { bill: ResidentBillSummary; admin?: boolean }) {
  const { t } = useTranslation()
  const status = bill.status === 'overdue' ? 'unpaid' : bill.status
  return <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
    <StatusChip status={status} label={t(`residentFinance.status.${status}`)} />
    {bill.cashRequestedAt && <StatusChip status="pending"
      label={t(admin ? 'billPayments.cashRequested' : 'billPayments.awaitingConfirmation')} />}
  </Stack>
}
