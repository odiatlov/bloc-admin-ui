import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import CachedIcon from '@mui/icons-material/Cached'
import { useTranslation } from 'react-i18next'
import AppDialog from '../../../../components/shared/AppDialog'
import EmptyState from '../../../../components/shared/EmptyState'
import LoadErrorState from '../../../../components/shared/LoadErrorState'
import PageHeader from '../../../../components/shared/PageHeader'
import ResponsiveDataView, { type DataColumn } from '../../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../../components/shared/StatusChip'
import {
  superAdminApi,
  type SuperAdminAdminAccountResponse,
  type SuperAdminBlockResponse,
  type SuperAdminInvitationResponse,
} from '../../../../services/superAdminApi'
import type { AdminInviteStatus, PlatformAdminRow } from '../../types'

const tableEmptyValue = '-'
const toDate = (value?: string) => value?.slice(0, 10)
const statusKey = (status: AdminInviteStatus) => status === 'no_block' ? 'noBlock' : status

const normalizeStatus = (status: string): AdminInviteStatus => {
  const normalized = status.trim().toLowerCase()
  if (normalized === 'pastdue') return 'past_due'
  if (normalized === 'active' || normalized === 'invited' || normalized === 'suspended' || normalized === 'cancelled' || normalized === 'expired') {
    return normalized
  }
  return 'no_block'
}

const mapAdminAccount = (adminAccount: SuperAdminAdminAccountResponse): PlatformAdminRow => ({
  id: adminAccount.adminAccountId,
  name: adminAccount.ownerName,
  email: adminAccount.ownerEmail,
  assignedBlockName: adminAccount.assignedBlocks.length > 0 ? adminAccount.assignedBlocks.map((block) => `Block ${block}`).join(', ') : undefined,
  status: normalizeStatus(adminAccount.status),
  createdAt: toDate(adminAccount.createdAt) ?? tableEmptyValue,
  isActive: adminAccount.status === 'Active',
})

const mapInvitation = (invitation: SuperAdminInvitationResponse): PlatformAdminRow => ({
  id: invitation.invitationId,
  name: invitation.inviteeName,
  email: invitation.email,
  assignedBlockName: invitation.blockName ? `Block ${invitation.blockName}` : undefined,
  status: normalizeStatus(invitation.status),
  createdAt: toDate(invitation.createdAt) ?? tableEmptyValue,
  lastInviteSentAt: toDate(invitation.lastSentAt),
  isActive: invitation.status !== 'Cancelled' && invitation.status !== 'Expired',
})

const ManageAdmins: React.FC = () => {
  const { t } = useTranslation()
  const [admins, setAdmins] = React.useState<PlatformAdminRow[]>([])
  const [blocks, setBlocks] = React.useState<SuperAdminBlockResponse[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [snackbar, setSnackbar] = React.useState('')
  const [form, setForm] = React.useState({ name: '', email: '', blockId: '' })

  const loadAdmins = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [adminAccounts, invitations, platformBlocks] = await Promise.all([
        superAdminApi.getAdminAccounts(),
        superAdminApi.getAdminInvitations(),
        superAdminApi.getBlocks(),
      ])
      setAdmins([...adminAccounts.map(mapAdminAccount), ...invitations.map(mapInvitation)])
      setBlocks(platformBlocks)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load platform administrators')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadAdmins()
  }, [loadAdmins])

  const getBlockOption = (blockId: string) => blocks.find((block) => block.blockId === blockId)

  const handleAddAdmin = () => {
    if (!form.name.trim() || !form.email.trim()) return
    const block = getBlockOption(form.blockId)

    setAdmins((current) => [
      {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        email: form.email.trim(),
        assignedBlockId: block?.blockId,
        assignedBlockName: block ? t('common.blockValue', { block: block.blockName }) : undefined,
        status: 'invited',
        createdAt: new Date().toISOString().slice(0, 10),
        lastInviteSentAt: new Date().toISOString().slice(0, 10),
        isActive: true,
      },
      ...current,
    ])
    setForm({ name: '', email: '', blockId: '' })
    setIsDialogOpen(false)
    setSnackbar(t('superAdmin.manageAdmins.snackbar.invitationSent'))
  }

  const handleResendInvite = (admin: PlatformAdminRow) => {
    setAdmins((current) => current.map((item) => item.id === admin.id ? { ...item, lastInviteSentAt: new Date().toISOString().slice(0, 10) } : item))
    setSnackbar(t('superAdmin.manageAdmins.snackbar.invitationSent'))
  }

  const columns: DataColumn<PlatformAdminRow>[] = [
    { key: 'name', label: t('superAdmin.manageAdmins.columns.name'), cardRole: 'primary', render: (admin) => admin.name },
    { key: 'email', label: t('superAdmin.manageAdmins.columns.email'), render: (admin) => admin.email },
    { key: 'assignedBlock', label: t('superAdmin.manageAdmins.columns.assignedBlock'), render: (admin) => admin.assignedBlockName ?? tableEmptyValue },
    {
      key: 'status',
      label: t('superAdmin.manageAdmins.columns.status'),
      cardRole: 'status',
      render: (admin) => <StatusChip status={admin.status} label={t(`superAdmin.manageAdmins.status.${statusKey(admin.status)}`)} />,
    },
    { key: 'createdAt', label: t('superAdmin.manageAdmins.columns.createdAt'), render: (admin) => admin.createdAt },
    { key: 'lastInviteSentAt', label: t('superAdmin.manageAdmins.columns.lastInviteSentAt'), render: (admin) => admin.lastInviteSentAt ?? tableEmptyValue },
    {
      key: 'actions',
      label: t('common.actions'),
      cardRole: 'actions',
      render: (admin) => (
        <Button size="small" startIcon={<CachedIcon />} onClick={() => handleResendInvite(admin)}>
          {t('superAdmin.manageAdmins.actions.resendInvite')}
        </Button>
      ),
    },
  ]

  return (
    <Box>
      <PageHeader
        title={t('superAdmin.manageAdmins.title')}
        description={t('superAdmin.manageAdmins.description')}
        actions={(
          <Button startIcon={<AddIcon />} variant="contained" onClick={() => setIsDialogOpen(true)}>
            {t('superAdmin.manageAdmins.actions.addAdmin')}
          </Button>
        )}
      />

      {isLoading ? (
        <Paper sx={{ alignItems: 'center', display: 'grid', gap: 1.5, justifyItems: 'center', p: 4 }}>
          <CircularProgress size={32} />
          <Typography color="text.secondary">{t('superAdmin.manageAdmins.loading')}</Typography>
        </Paper>
      ) : error ? (
        <LoadErrorState helperText={t('superAdmin.manageAdmins.errors.loadFailed')} onRetry={loadAdmins} />
      ) : admins.length === 0 ? (
        <EmptyState
          actionLabel={t('superAdmin.manageAdmins.actions.addAdmin')}
          headline={t('superAdmin.manageAdmins.empty.headline')}
          helperText={t('superAdmin.manageAdmins.empty.helperText')}
          onAction={() => setIsDialogOpen(true)}
        />
      ) : (
        <ResponsiveDataView
          ariaLabel={t('superAdmin.manageAdmins.title')}
          columns={columns}
          desktopTableMinWidth={1200}
          getRowId={(admin) => admin.id}
          rows={admins}
        />
      )}

      <AppDialog
        cancelLabel={t('common.cancel')}
        confirmDisabled={!form.name.trim() || !form.email.trim()}
        confirmLabel={t('superAdmin.manageAdmins.actions.sendInvite')}
        contentSx={{ display: 'grid', gap: 2 }}
        onCancel={() => setIsDialogOpen(false)}
        onConfirm={handleAddAdmin}
        open={isDialogOpen}
        title={t('superAdmin.manageAdmins.dialog.title')}
      >
        <TextField autoFocus required label={t('superAdmin.manageAdmins.columns.name')} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        <TextField required type="email" label={t('superAdmin.manageAdmins.columns.email')} value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
        <FormControl>
          <InputLabel>{t('superAdmin.manageAdmins.dialog.blockAssignment')}</InputLabel>
          <Select label={t('superAdmin.manageAdmins.dialog.blockAssignment')} value={form.blockId} onChange={(event: SelectChangeEvent) => setForm((current) => ({ ...current, blockId: event.target.value }))}>
            <MenuItem value="">{t('superAdmin.manageAdmins.dialog.noBlock')}</MenuItem>
            {blocks.map((block) => (
              <MenuItem key={block.blockId} value={block.blockId}>
                {t('common.blockValue', { block: block.blockName })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </AppDialog>
      <Snackbar
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        open={Boolean(snackbar)}
        autoHideDuration={3000}
        message={snackbar}
        onClose={() => setSnackbar('')}
      />
    </Box>
  )
}

export default ManageAdmins
