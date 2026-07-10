import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import AddIcon from '@mui/icons-material/Add'
import BlockIcon from '@mui/icons-material/Block'
import CachedIcon from '@mui/icons-material/Cached'
import LinkIcon from '@mui/icons-material/Link'
import { useTranslation } from 'react-i18next'
import AppDialog from '../../components/shared/AppDialog'
import PageHeader from '../../components/shared/PageHeader'
import ResponsiveDataView, { type DataColumn } from '../../components/shared/ResponsiveDataView'
import StatusChip from '../../components/shared/StatusChip'
import { blocks } from '../../mocks/blocks'
import { mockAdminInvites, type AdminInviteStatus, type PlatformAdminRow } from '../../mocks/superAdmin'

const tableEmptyValue = '-'

const statusKey = (status: AdminInviteStatus) => status === 'no_block' ? 'noBlock' : status

const ManageAdmins: React.FC = () => {
  const { t } = useTranslation()
  const [admins, setAdmins] = React.useState<PlatformAdminRow[]>(mockAdminInvites)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [snackbar, setSnackbar] = React.useState('')
  const [form, setForm] = React.useState({ name: '', email: '', blockId: '' })

  const getBlockOption = (blockId: string) => blocks.find((block) => block.id === blockId)

  const handleAddAdmin = () => {
    if (!form.name.trim() || !form.email.trim()) return
    const block = getBlockOption(form.blockId)

    setAdmins((current) => [
      {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        email: form.email.trim(),
        assignedBlockId: block?.id,
        assignedBlockName: block ? t('common.blockValue', { block: block.name }) : undefined,
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

  const handleAssignBlock = (admin: PlatformAdminRow) => {
    const currentIndex = blocks.findIndex((block) => block.id === admin.assignedBlockId)
    const nextBlock = blocks[(currentIndex + 1) % blocks.length]
    setAdmins((current) => current.map((item) => item.id === admin.id
      ? {
          ...item,
          assignedBlockId: nextBlock.id,
          assignedBlockName: t('common.blockValue', { block: nextBlock.name }),
          status: item.status === 'no_block' ? 'invited' : item.status,
        }
      : item))
    setSnackbar(t('superAdmin.manageAdmins.snackbar.blockAssigned'))
  }

  const handleResendInvite = (admin: PlatformAdminRow) => {
    setAdmins((current) => current.map((item) => item.id === admin.id ? { ...item, lastInviteSentAt: new Date().toISOString().slice(0, 10) } : item))
    setSnackbar(t('superAdmin.manageAdmins.snackbar.invitationSent'))
  }

  const handleDeactivate = (admin: PlatformAdminRow) => {
    setAdmins((current) => current.map((item) => item.id === admin.id ? { ...item, isActive: false, status: 'no_block' } : item))
    setSnackbar(t('superAdmin.manageAdmins.snackbar.deactivated'))
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
        <>
          <Button size="small" startIcon={<LinkIcon />} onClick={() => handleAssignBlock(admin)}>
            {admin.assignedBlockId ? t('superAdmin.manageAdmins.actions.reassignBlock') : t('superAdmin.manageAdmins.actions.assignBlock')}
          </Button>
          <Button size="small" startIcon={<CachedIcon />} onClick={() => handleResendInvite(admin)}>
            {t('superAdmin.manageAdmins.actions.resendInvite')}
          </Button>
          <Button size="small" startIcon={<BlockIcon />} onClick={() => handleDeactivate(admin)} disabled={!admin.isActive}>
            {t('superAdmin.manageAdmins.actions.deactivate')}
          </Button>
        </>
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

      <ResponsiveDataView
        ariaLabel={t('superAdmin.manageAdmins.title')}
        columns={columns}
        desktopTableMinWidth={1200}
        getRowId={(admin) => admin.id}
        rows={admins}
      />

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
              <MenuItem key={block.id} value={block.id}>
                {t('common.blockValue', { block: block.name })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </AppDialog>
      <Snackbar open={Boolean(snackbar)} autoHideDuration={3000} message={snackbar} onClose={() => setSnackbar('')} />
    </Box>
  )
}

export default ManageAdmins
