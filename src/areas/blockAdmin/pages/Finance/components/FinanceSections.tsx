import React from 'react'
import { Alert, Box, Button, Chip, Paper, Tab, Tabs, Typography } from '@mui/material'
import CalculateIcon from '@mui/icons-material/Calculate'
import EditIcon from '@mui/icons-material/Edit'
import RefreshIcon from '@mui/icons-material/Refresh'
import SettingsIcon from '@mui/icons-material/Settings'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ResponsiveDataView, { type DataColumn } from '../../../../../components/shared/ResponsiveDataView'
import { financeApi } from '../../../../../services/financeApi'
import { ApiError } from '../../../../../services/apiClient'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { useFinanceActionScope } from '../../../../../hooks/useFinanceWorkspace'
import type { FinanceIssue, FinanceWorkspace } from '../../../../../types/finance'
import FinanceWorkspacePanel from './FinanceWorkspacePanel'
import FinancePeriodEditor from './FinancePeriodEditor'

const MonthlyWorkspace: React.FC<{ workspace: FinanceWorkspace; refresh: () => void; onDirty: (dirty: boolean) => void }> = ({ workspace, refresh, onDirty }) => {
  const { t, i18n } = useTranslation()
  const { account } = React.useContext(RoleContext)
  const [tab, setTab] = React.useState(0)
  const [dirty, setDirty] = React.useState(false)
  const [generating, setGenerating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const busy = React.useRef(false)
  const active = useFinanceActionScope()
  const month = new Intl.DateTimeFormat(i18n.language, { year: 'numeric', month: 'long' }).format(new Date(workspace.year, workspace.month - 1, 1))
  const generate = async () => {
    if (busy.current || !workspace.canGenerate || dirty) return
    busy.current = true; setGenerating(true); setError(null)
    const storageKey = `finance-generation:${account.id}:${workspace.blockId}:${workspace.year}-${workspace.month}:${workspace.inputVersion}`
    let requestId: string
    try { requestId = sessionStorage.getItem(storageKey) || crypto.randomUUID(); sessionStorage.setItem(storageKey, requestId) }
    catch { requestId = crypto.randomUUID() }
    try {
      await financeApi.generate(workspace.blockId, workspace.year, workspace.month, requestId, workspace.inputVersion)
      try { sessionStorage.removeItem(storageKey) } catch { /* Session storage can be disabled by the browser. */ }
      if (active.current) refresh()
    }
    catch (nextError) {
      if (nextError instanceof ApiError && nextError.code === 'INPUTS_CHANGED') { try { sessionStorage.removeItem(storageKey) } catch { /* Keep the server error visible. */ } }
      if (active.current) setError(nextError instanceof Error ? nextError.message : t('finance.billing.generateFailed'))
    }
    finally { busy.current = false; if (active.current) setGenerating(false) }
  }
  const resolve = (issue: FinanceIssue) => {
    if (issue.apartmentId && /PREVIOUS_READING_MISSING|CURRENT_READING_MISSING|INVALID_READING|OCCUPANTS_INCONSISTENT|INACTIVE_METER_HISTORY/.test(issue.code)) {
      const query = new URLSearchParams({ blockId: workspace.blockId, period: `${issue.year ?? workspace.year}-${String(issue.month ?? workspace.month).padStart(2, '0')}`, ...(issue.apartmentId ? { apartmentId: issue.apartmentId } : {}) })
      return `/admin/consumption?${query}`
    }
    if (/APARTMENT_SETUP_REQUIRED|APARTMENT_STAIRCASE_REQUIRED|APARTMENTS_MISSING|USABLE_AREA_MISSING|OCCUPANT_CONTACT_MISSING/.test(issue.code)) return `/admin/apartments?blockId=${workspace.blockId}`
    if (/CONFIGURATION_MISSING|HEATING_MP_MISSING|SUPPLY_COVERAGE_REQUIRED|CHARGES_REQUIRED/.test(issue.code)) return `/admin/settings?blockId=${workspace.blockId}&period=${workspace.year}-${String(workspace.month).padStart(2, '0')}`
    return undefined
  }
  const issueColumns: DataColumn<FinanceIssue & { id: string }>[] = [
    { key: 'location', label: t('finance.billing.location'), cardRole: 'primary', render: (issue) => [issue.staircaseName, issue.apartmentNumber && t('finance.billing.apartmentNumber', { number: issue.apartmentNumber }), issue.meterName].filter(Boolean).join(' / ') || workspace.blockName },
    { key: 'context', label: t('finance.billing.issueContext'), render: (issue) => [issue.chargeId && workspace.configuration.charges.find((charge) => charge.id === issue.chargeId)?.name, issue.supplyGroupId && workspace.configuration.supplyGroups.find((group) => group.id === issue.supplyGroupId)?.name, issue.year && issue.month ? new Intl.DateTimeFormat(i18n.language, { year: 'numeric', month: 'long' }).format(new Date(issue.year, issue.month - 1, 1)) : month].filter(Boolean).join(' · ') },
    { key: 'issue', label: t('finance.billing.issue'), cardRole: 'secondary', render: (issue) => t(`finance.billing.issues.${issue.code}`, { defaultValue: issue.message }) },
    { key: 'actions', label: t('common.actions'), cardRole: 'actions', actions: (issue) => [{ id: 'resolve', label: t('finance.billing.resolve'), icon: <EditIcon />, priority: 1, ...(resolve(issue) ? { to: resolve(issue) } : { onClick: () => setTab(1) }) }] },
  ]
  return <Box sx={{ display: 'grid', gap: 2 }}>
    <Paper><Tabs value={tab} onChange={(_, value: number) => setTab(value)} variant="fullWidth"><Tab label={t('finance.billing.maintenance')} /><Tab label={t('finance.billing.monthlyExpenses')} /></Tabs></Paper>
    <Box hidden={tab !== 0} sx={{ display: tab === 0 ? 'grid' : 'none', gap: 2 }}>
      <Paper sx={{ p: 2, display: 'grid', gap: 2 }}>
        <Typography variant="h6">{workspace.blockName} · {month}</Typography>
        <Typography color="text.secondary">{t('finance.billing.periodExplanation')}</Typography>
        <Alert severity={workspace.canGenerate ? 'success' : 'warning'}>{workspace.canGenerate ? t('finance.billing.ready') : t('finance.billing.blocked', { count: workspace.issues.length })}</Alert>
        {dirty && <Alert severity="warning">{t('finance.billing.saveBeforeGenerate')}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, flexWrap: 'wrap', '& > .MuiButton-root': { width: { xs: '100%', sm: 'auto' }, justifyContent: 'center', textAlign: 'center' } }}>
          <Button variant="contained" startIcon={<CalculateIcon />} disabled={!workspace.canGenerate || dirty || generating} onClick={() => void generate()}>{generating ? t('finance.billing.generating') : t(workspace.latestReport ? 'finance.billing.regenerate' : 'finance.billing.generate', { block: workspace.blockName })}</Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} disabled={dirty || generating} onClick={refresh}>{t('finance.billing.refreshReadiness')}</Button>
          <Button component={RouterLink} to={`/admin/settings?blockId=${workspace.blockId}&period=${workspace.year}-${String(workspace.month).padStart(2, '0')}`} startIcon={<SettingsIcon />}>{t('finance.billing.configureBlock')}</Button>
        </Box>
      </Paper>
      {workspace.latestReport && <Paper sx={{ p: 2, display: 'grid', gap: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}><Typography variant="h6">{t('finance.billing.savedReport')}</Typography><Chip size="small" color={workspace.latestReport.status === 'Published' ? 'success' : workspace.latestReport.status === 'Outdated' ? 'warning' : 'default'} label={t(`finance.billing.values.${workspace.latestReport.status}`)} /></Box>
        <Typography>{t('finance.billing.revision', { revision: workspace.latestReport.revision })} · {new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'RON' }).format(workspace.latestReport.totalDue)}</Typography>
        <Button component={RouterLink} to={`/admin/reports/maintenance/${workspace.latestReport.id}`} variant="outlined">{t('finance.billing.openReport')}</Button>
      </Paper>}
      {workspace.issues.length > 0 && <ResponsiveDataView paginationId="finance-readiness" paginationResetKey={workspace.inputVersion} ariaLabel={t('finance.billing.prerequisites')} rows={workspace.issues.map((issue, index) => ({ ...issue, id: String(index) }))} columns={issueColumns} getRowId={(issue) => issue.id} />}
    </Box>
    <Box hidden={tab !== 1} sx={{ display: tab === 1 ? 'block' : 'none' }}><FinancePeriodEditor workspace={workspace} refresh={refresh} onDirty={(value) => { setDirty(value); onDirty(value) }} /></Box>
  </Box>
}

const FinanceSections: React.FC = () => <FinanceWorkspacePanel>{(workspace, _block, refresh, onDirty) => <MonthlyWorkspace key={`${workspace.blockId}:${workspace.year}:${workspace.month}:${workspace.configurationVersion}:${workspace.periodVersion}:${workspace.inputVersion}`} workspace={workspace} refresh={refresh} onDirty={onDirty} />}</FinanceWorkspacePanel>
export default FinanceSections
