import { useRef, useState } from 'react'
import { Alert, Box, Typography } from '@mui/material'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import { useTranslation } from 'react-i18next'
import AppDialog from '../../../../../components/shared/AppDialog'
import BillBreakdownSection from '../../../../../components/shared/BillBreakdownSection'
import IconOptionCards from '../../../../../components/shared/IconOptionCards'
import LoadingState from '../../../../../components/shared/LoadingState'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import { useFinanceActionScope } from '../../../../../hooks/useFinanceWorkspace'
import type { ResidentBillDetail } from '../../../../../types/finance'
import { ApiError } from '../../../../../services/apiClient'

type DetailProps = { detail?: ResidentBillDetail; loading: boolean; error?: string; onRetry: () => void }

function BillCostSummary({ detail }: { detail: ResidentBillDetail }) {
  const { t, i18n } = useTranslation()
  const { bill, breakdown } = detail
  const { row } = breakdown
  const money = new Intl.NumberFormat(i18n.language, { style: 'currency', currency: bill.currency })
  const amountLine = (label: string, amount: number, emphasized = false) => <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
    <Typography variant="body2" sx={{ fontWeight: emphasized ? 700 : undefined, overflowWrap: 'anywhere' }}>{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: emphasized ? 700 : undefined, whiteSpace: 'nowrap' }}>{money.format(amount)}</Typography>
  </Box>

  return <Box sx={{ display: 'grid', gap: 1.5 }}>
    <Typography color="text.secondary">{bill.reference}</Typography>
    {row.charges.map((charge, index) => <BillBreakdownSection key={`${charge.chargeId}:${index}`} compact
      title={charge.name} amount={money.format(charge.amount)} />)}
    {(!!row.adjustmentDetails?.length || bill.carriedForwardArrears > 0) &&
      <BillBreakdownSection compact title={t('finance.billing.adjustments')}>
        {row.adjustmentDetails?.map(entry => <Box key={entry.id}>{amountLine(entry.name, entry.amount)}</Box>)}
        {bill.carriedForwardArrears > 0 && amountLine(t('billPayments.previouslyBilled'), -bill.carriedForwardArrears)}
      </BillBreakdownSection>}
    <BillBreakdownSection compact title={t('resident.bills.summary.title')}>
      {bill.paidAmount > 0 && amountLine(t('residentFinance.paidAmount'), -bill.paidAmount)}
      {(bill.compensationReceived ?? 0) > 0 && amountLine(t('financeCorrections.creditApplied'), -(bill.compensationReceived ?? 0))}
      {(bill.compensationTransferred ?? 0) > 0 && amountLine(t('financeCorrections.creditTransferred'), bill.compensationTransferred ?? 0)}
      {(bill.correctionDebitApplied ?? 0) > 0 && amountLine(t('financeCorrections.debitApplied'), bill.correctionDebitApplied ?? 0)}
      {(bill.correctionDebitTransferred ?? 0) > 0 && amountLine(t('financeCorrections.debitTransferred'), -(bill.correctionDebitTransferred ?? 0))}
      {(bill.pendingCorrectionDebit ?? 0) > 0 && <Typography variant="body2">{t('financeCorrections.pendingDebitHelp', { amount: money.format(bill.pendingCorrectionDebit ?? 0) })}</Typography>}
      {amountLine(t('finance.billing.totalDue'), bill.remainingAmount, true)}
    </BillBreakdownSection>
  </Box>
}

export function BillCostDialog({ detail, loading, error, onRetry, onClose, onContinue }: DetailProps & {
  onClose: () => void; onContinue: () => void
}) {
  const { t } = useTranslation()
  const payable = detail && detail.bill.remainingAmount > 0 && !detail.bill.cashRequestedAt
  return <AppDialog open title={t('billPayments.costBreakdown')} onCancel={onClose} cancelLabel={t('common.cancel')}
    onConfirm={onContinue} confirmLabel={t('resident.bills.payBill')} confirmStartIcon={<PaymentsOutlinedIcon />} confirmDisabled={!payable}
    dialogContentSx={{ pt: '8px !important' }}>
    {loading ? <LoadingState label={t('finance.billing.loading')} /> : error
      ? <LoadErrorState helperText={t('residentFinance.billError')} onRetry={onRetry} />
      : detail && <BillCostSummary detail={detail} />}
  </AppDialog>
}

export function BillPaymentMethodDialog({ detail, loading, error, onRetry, onClose, onRequest, onSent }: DetailProps & {
  onClose: () => void; onRequest: (id: string) => Promise<unknown>; onSent: () => void
}) {
  const { t, i18n } = useTranslation()
  const [pending, setPending] = useState(false)
  const [requestError, setRequestError] = useState<string>()
  const submitting = useRef(false)
  const active = useFinanceActionScope()
  const bill = detail?.bill
  const payable = bill && bill.remainingAmount > 0 && !bill.cashRequestedAt

  const submit = async () => {
    if (!bill || !payable || submitting.current) return
    submitting.current = true
    setPending(true)
    setRequestError(undefined)
    try {
      await onRequest(bill.id)
      if (active.current) onSent()
    } catch (error) {
      if (active.current) setRequestError(t(error instanceof ApiError && error.code === 'BILL_ADMIN_UNAVAILABLE'
        ? 'billPayments.adminUnavailable' : 'billPayments.requestError'))
    } finally {
      submitting.current = false
      if (active.current) setPending(false)
    }
  }

  return <AppDialog open title={t('billPayments.chooseMethod')} maxWidth="md" pending={pending}
    onCancel={onClose} cancelLabel={t('common.cancel')} onConfirm={() => { void submit() }}
    confirmDisabled={!payable} confirmLabel={t('billPayments.sendCashRequest')}
    dialogContentSx={{ pt: '8px !important' }} contentSx={{ display: 'grid', gap: 2 }}>
    {loading ? <LoadingState label={t('finance.billing.loading')} /> : error
      ? <LoadErrorState helperText={t('residentFinance.billError')} onRetry={onRetry} />
      : bill && <Typography color="text.secondary">{bill.reference} · {new Intl.NumberFormat(i18n.language,
        { style: 'currency', currency: bill.currency }).format(bill.remainingAmount)}</Typography>}
    <IconOptionCards label={t('billPayments.chooseMethod')} value="cash" disabled={pending}
      options={[
        { value: 'cash', icon: <PaymentsOutlinedIcon />, label: t('billPayments.payInCash') },
        { value: 'card', icon: <CreditCardIcon />, label: t('billPayments.payByCard'), caption: t('billPayments.comingSoon'), disabled: true },
      ]} />
    {requestError && <Alert severity="error">{requestError}</Alert>}
  </AppDialog>
}
