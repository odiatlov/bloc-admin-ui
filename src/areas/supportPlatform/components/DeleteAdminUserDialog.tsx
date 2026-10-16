import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import ListItem from '@mui/material/ListItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useTranslation } from 'react-i18next'
import AppDialog from '../../../components/shared/AppDialog'
import EmptyState from '../../../components/shared/EmptyState'
import LoadErrorState from '../../../components/shared/LoadErrorState'
import ResponsiveDataView, { type DataColumn } from '../../../components/shared/ResponsiveDataView'
import { translatePlatformUserValue } from '../../../domain/displayLabels'
import { useAdminUserDeletion } from '../hooks/useAdminUserDeletion'
import type { AdminUserDeletionPreview } from '../types/adminUserDeletion'

type Props = { userId: string; actorKey: string; userOnly?: boolean; onClose: () => void; onCommitted: () => void }
type StatisticRow = { key: string; caption: string; count: number }

const DeleteAdminUserDialog = ({ userId, actorKey, userOnly = false, onClose, onCommitted }: Props) => {
  const { t } = useTranslation()
  const flow = useAdminUserDeletion(userId, actorKey, onCommitted, userOnly)
  const label = (key: string) => t(`adminUserDeletion.${key}`)
  const scopeLabel = (key: string) => label(flow.userOnly ? `userOnly.${key}` : key)
  const pending = flow.stage === 'submitting' || flow.stage === 'resolving'
  const completed = flow.stage === 'completed'
  const unknown = flow.stage === 'unknown'
  const knownErrors: Record<string, string> = {
    TRUSTED_AUTH_REQUIRED: 'authRequired', DELETION_DISABLED: 'disabled', DELETION_SCHEMA_REQUIRED: 'schemaRequired', DELETION_SCOPE_CHANGED: 'scopeChanged',
    DELETION_PREVIEW_EXPIRED: 'expired', DELETION_INVALID_CONFIRMATION: 'invalidConfirmation',
    DELETION_HIERARCHY_CONFLICT: 'repairRequired', DELETION_INVITATION_CONFLICT: 'repairRequired',
    DELETION_SCOPE_TOO_LARGE: 'tooLarge', DELETION_OPERATION_CONFLICT: 'operationConflict',
    DELETION_TARGET_NOT_FOUND: 'targetUnavailable', DELETION_TARGET_NOT_ADMIN: 'targetUnavailable',
    DELETION_STORAGE_REQUIRED: 'storageRequired',
    DELETION_OPERATION_BUSY: 'operationBusy', DELETION_OPERATION_CANCELLED: 'operationCancelled',
    DELETION_CSRF_INVALID: 'csrfInvalid',
    DELETION_USER_HAS_RESIDENT: 'userOnly.hasResident', DELETION_USER_HAS_ADMIN_ACCOUNTS: 'userOnly.hasAdminAccounts',
  }
  const preview = flow.preview
  const statisticRows: StatisticRow[] = preview ? flow.userOnly
    ? [{ key: 'userAccount', caption: label('userOnly.login'), count: 1 }, ...['roles', 'deletedNotifications', 'detachedNotifications', 'detachedReadings']
      .map((key) => ({ key, caption: label(`counts.${key}`), count: preview.counts[key as keyof typeof preview.counts] }))]
    : Object.entries(preview.counts).map(([key, count]) => ({ key, caption: label(`counts.${key}`), count })) : []
  const statistics: DataColumn<StatisticRow>[] = [
    { key: 'caption', label: label('statistic'), cardRole: 'primary', render: (row) => row.caption },
    { key: 'count', label: label('count'), render: (row) => row.count },
  ]
  const residents: DataColumn<AdminUserDeletionPreview['residents'][number]>[] = [
    { key: 'name', label: label('residentName'), cardRole: 'primary', render: (row) => row.name },
    { key: 'outcome', label: label('outcome'), render: (row) => label(row.preserved ? 'preserve' : 'deleteProfile') },
    { key: 'reasons', label: label('reason'), render: (row) => row.reasons.map((reason) =>
      ['membership', 'assignment', 'management', 'role'].includes(reason) ? label(`reasons.${reason}`) : label('association')).join(', ') || label('exclusive') },
  ]
  const roles: DataColumn<AdminUserDeletionPreview['survivingBlockRoleEffects'][number]>[] = [
    { key: 'block', label: label('block'), cardRole: 'primary', render: (row) => row.blockName },
    { key: 'role', label: label('removedRole'), render: (row) => translatePlatformUserValue(t, 'roles', row.role) },
  ]
  return <AppDialog open title={scopeLabel('title')} maxWidth="md" onCancel={onClose} pending={pending}
    cancelLabel={t('common.close')} confirmLabel={completed ? t('common.close') : unknown ? label('retrySame') : pending ? label(flow.stage === 'resolving' ? 'resolving' : 'deleting') : label('confirm')}
    confirmColor={completed ? 'primary' : 'error'} confirmDisabled={!completed && !unknown && !flow.canSubmit}
    hideCancelButton={completed} onConfirm={completed ? onClose : unknown ? flow.retrySameOperation : flow.submit}
    contentSx={{ display: 'grid', gap: 2, overflowWrap: 'anywhere' }}>
    {flow.stage === 'loading' && <Box role="status" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <CircularProgress size={24} /><Typography>{label('loading')}</Typography>
    </Box>}
    {pending && <Box role="status" aria-live="polite" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <CircularProgress size={24} /><Typography>{label(flow.stage === 'resolving' ? 'resolving' : 'deleting')}</Typography>
    </Box>}
    {flow.error && <Alert severity="error">{label(knownErrors[flow.error] ?? 'failed')}</Alert>}
    {flow.diagnostic && <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{label('diagnostic')}: {flow.diagnostic}</Typography>}
    {flow.stage === 'error' && <LoadErrorState onRetry={flow.refresh} />}
    {flow.stage === 'cancelled' && <Alert severity="info" action={<Button onClick={flow.refresh}>{label('reloadPreview')}</Button>}>{label('operationCancelled')}</Alert>}
    {unknown && <>
      <Alert severity="warning">{label('unknown')}</Alert>
      <Typography variant="body2">{label('operation')}: {flow.operationId}</Typography>
      <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { void flow.checkOutcome() }}>{label('checkOutcome')}</Button>
      <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { void flow.resolveOperation() }}>{label('resolveOperation')}</Button>
    </>}
    {completed && <Alert severity="success" role="status">{scopeLabel('success')}</Alert>}
    {preview && !completed && !unknown && flow.stage !== 'error' && <>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>{preview.email}</Typography>
      {preview.developmentSession && <Alert severity="info">{label('developmentSession')}</Alert>}
      <Alert severity="warning">{scopeLabel('warning')}</Alert>
      {!flow.userOnly && <>
        <Typography variant="subtitle1">{label('accounts')}</Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.5 }}>{preview.adminAccounts.map((account) => <li key={account.id}>{account.name}</li>)}</Box>
        <Typography variant="subtitle1">{label('buildings')}</Typography>
        {preview.blocks.length ? <Box component="ul" sx={{ m: 0, pl: 2.5 }}>{preview.blocks.map((block) => <li key={block.id}>{block.name}</li>)}</Box>
          : <EmptyState headline={label('noBuildings')} helperText={label('noBuildingsHelper')} />}
      </>}
      <Typography variant="subtitle1">{label('statistics')}</Typography>
      <ResponsiveDataView columns={statistics}
        rows={statisticRows}
        getRowId={(row) => row.key} paginationId={`deletion-statistics-${userId}`}
        renderMobileRow={(row) => <ListItem divider sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 2, px: 0, py: 1 }}>
          <Typography variant="body2" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>{row.caption}</Typography>
          <Typography variant="body2" sx={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.count}</Typography>
        </ListItem>}
        desktopTableMinWidth={560} ariaLabel={label('statistics')} />
      {!flow.userOnly && <>
        <Typography variant="subtitle1">{label('residentOutcomes')}</Typography>
        <ResponsiveDataView columns={residents} rows={preview.residents} getRowId={(row) => row.id}
          paginationId={`deletion-residents-${userId}`} desktopTableMinWidth={560} ariaLabel={label('residentOutcomes')}
          emptyState={<EmptyState headline={label('noResidents')} helperText={label('noResidentsHelper')} />} />
      </>}
      {preview.survivingBlockRoleEffects.length > 0 && <>
        <Alert severity="warning">{label('roleWarning')}</Alert>
        <ResponsiveDataView columns={roles} rows={preview.survivingBlockRoleEffects} getRowId={(row) => `${row.blockId}-${row.role}`}
          paginationId={`deletion-roles-${userId}`} ariaLabel={label('removedRole')} />
      </>}
      {flow.expired ? <Alert severity="warning" action={<Button onClick={flow.refresh}>{label('reloadPreview')}</Button>}>{label('expired')}</Alert> : null}
      <TextField label={label('typeEmail')} value={flow.email} onChange={(event) => flow.setEmail(event.target.value)}
        disabled={pending || flow.expired} autoComplete="off" fullWidth />
      <FormControlLabel sx={{ alignItems: 'flex-start', m: 0 }} control={<Checkbox checked={flow.acknowledged}
        sx={{ p: 0, mr: 1.5 }}
        disabled={pending || flow.expired} onChange={(event) => flow.setAcknowledged(event.target.checked)} />} label={scopeLabel('acknowledge')} />
    </>}
  </AppDialog>
}

export default DeleteAdminUserDialog
