import { useContext, useState } from 'react'
import { Alert, Box, MenuItem, TextField, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import AppDatePicker from '../../../../../components/shared/AppDatePicker'
import AppDialog from '../../../../../components/shared/AppDialog'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { useFinanceActionScope } from '../../../../../hooks/useFinanceWorkspace'
import { ApiError } from '../../../../../services/apiClient'
import { financeApi } from '../../../../../services/financeApi'
import type { MaintenanceReport, PublishFinanceRequest } from '../../../../../types/finance'

type Props = { report: MaintenanceReport; onClose: () => void; onPublished: () => void }

const FinancePublishDialog = ({ report, onClose, onPublished }: Props) => {
  const { t, i18n } = useTranslation()
  const { account } = useContext(RoleContext)
  const active = useFinanceActionScope()
  const storageKey = `finance.publish.${account.id}.${report.id}`
  const [savedRequest, setSavedRequest] = useState<PublishFinanceRequest | undefined>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null') as PublishFinanceRequest | null
      return saved?.requestId && saved.expectedInputVersion === report.inputVersion && Array.isArray(saved.arrears) ? saved : undefined
    } catch { return undefined }
  })
  const [dueDate, setDueDate] = useState(savedRequest?.dueDate ?? '')
  const [decisions, setDecisions] = useState<Record<string, 'Opening' | 'CarriedForward' | ''>>(() =>
    Object.fromEntries(savedRequest?.arrears.map(x => [x.apartmentId, x.treatment]) ?? []))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rows = report.sheets.flatMap(sheet => sheet.rows)
  const arrears = rows.filter(row => row.arrears !== 0)
  const money = (amount: number) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: report.currency }).format(amount)
  const publish = async () => {
    if (pending) return
    const request = savedRequest ?? {
      requestId: crypto.randomUUID(), expectedInputVersion: report.inputVersion, dueDate,
      arrears: arrears.map(row => ({ apartmentId: row.apartmentId, treatment: decisions[row.apartmentId] as 'Opening' | 'CarriedForward' })),
    }
    // Keep the exact body across uncertain network outcomes, including closing/reopening the dialog.
    try { sessionStorage.setItem(storageKey, JSON.stringify(request)) } catch { /* In-memory identity still protects this attempt. */ }
    setSavedRequest(request); setPending(true); setError(null)
    try {
      await financeApi.publish(report.id, request)
      try { sessionStorage.removeItem(storageKey) } catch { /* Storage may be disabled. */ }
      if (active.current) onPublished()
    } catch (cause) {
      if (!active.current) return
      if (cause instanceof ApiError && [400, 403, 404, 409].includes(cause.status)) {
        try { sessionStorage.removeItem(storageKey) } catch { /* Storage may be disabled. */ }
        setSavedRequest(undefined)
      }
      setError(cause instanceof ApiError ? t(`financePublication.errors.${cause.code ?? 'unknown'}`, { defaultValue: t('financePublication.errors.unknown') }) : t('financePublication.uncertain'))
    } finally { if (active.current) setPending(false) }
  }
  return <AppDialog open title={t('financePublication.title')} cancelLabel={t('common.cancel')}
    confirmLabel={t(pending ? 'financePublication.publishing' : savedRequest ? 'financePublication.retry' : 'financePublication.publish')}
    pending={pending} confirmDisabled={!dueDate || arrears.some(row => !decisions[row.apartmentId]) || report.status !== 'Draft' || !!report.periodPublished}
    onCancel={onClose} onConfirm={() => { void publish() }}>
    <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
      <Typography>{report.blockName} · {new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(new Date(report.year, report.month - 1, 1))} · {t('finance.billing.revisionLabel')} {report.revision}</Typography>
      <Typography>{t('financePublication.summary', { count: rows.length, amount: money(report.totalDue) })}</Typography>
      <Alert severity="info">{t('financePublication.visibility')}</Alert>
      <AppDatePicker label={t('financePublication.dueDate')} value={dueDate} onChange={setDueDate} disabled={pending || !!savedRequest} />
      {arrears.length > 0 && <Alert severity="warning">{t('financePublication.arrearsHelp')}</Alert>}
      {arrears.map(row => <TextField key={row.apartmentId} select fullWidth size="small"
        label={t('financePublication.arrearsLabel', { apartment: row.number, amount: money(row.arrears) })}
        value={decisions[row.apartmentId] ?? ''} disabled={pending || !!savedRequest}
        onChange={event => setDecisions(previous => ({ ...previous, [row.apartmentId]: event.target.value as 'Opening' | 'CarriedForward' }))}>
        <MenuItem value="Opening">{t('financePublication.opening')}</MenuItem>
        <MenuItem value="CarriedForward">{t('financePublication.carried')}</MenuItem>
      </TextField>)}
      {savedRequest && !pending && <Alert severity="info">{t('financePublication.retryHelp')}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
    </Box>
  </AppDialog>
}
export default FinancePublishDialog
