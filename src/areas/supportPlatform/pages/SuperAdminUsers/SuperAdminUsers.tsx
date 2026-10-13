import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import VisibilityIcon from '@mui/icons-material/Visibility'
import PersonIcon from '@mui/icons-material/Person'
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff'
import { useTranslation } from 'react-i18next'
import AppDialog from '../../../../components/shared/AppDialog'
import EmptyState from '../../../../components/shared/EmptyState'
import FilterBar from '../../../../components/shared/FilterBar'
import LoadErrorState from '../../../../components/shared/LoadErrorState'
import PageHeader from '../../../../components/shared/PageHeader'
import ResponsiveDataView, { type DataColumn } from '../../../../components/shared/ResponsiveDataView'
import SearchField from '../../../../components/shared/SearchField'
import { translatePlatformUserValue } from '../../../../domain/displayLabels'
import type { SuperAdminUserResponse, UserApartmentAssociation, UserBlockAssociation, UserRoleAssociation, UserAdminAssociation } from '../../../../services/superAdminApi'
import { useSuperAdminUsers } from '../../hooks/useSuperAdminUsers'

const associatedBlocks = (user: SuperAdminUserResponse) => [...new Map([
  ...user.roles, ...user.residentBlocks, ...user.apartments, ...user.adminAccounts.flatMap((account) => account.blocks),
].map((block) => [block.blockId, block])).values()]

const SuperAdminUsers = () => {
  const { t, i18n } = useTranslation()
  const users = useSuperAdminUsers()
  const { page } = users
  const [report, setReport] = React.useState<{ user: SuperAdminUserResponse; tab: number } | null>(null)
  const label = (key: string) => t(`superAdmin.users.${key}`)
  const statusLabel = (status: string) => translatePlatformUserValue(t, 'statuses', status)
  const roleLabel = (role: string) => translatePlatformUserValue(t, 'roles', role)
  const date = (value?: string | null) => value ? new Intl.DateTimeFormat(i18n.language).format(new Date(value)) : '-'
  const badges = (values: string[]) => values.length ? <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
    {values.map((value, index) => <Chip key={`${value}-${index}`} size="small" label={value}
      sx={{ maxWidth: '100%', height: 'auto', minHeight: 24, '& .MuiChip-label': { whiteSpace: 'normal', overflowWrap: 'anywhere', py: 0.25 } }} />)}
  </Box> : label('none')
  const columns: DataColumn<SuperAdminUserResponse>[] = [
    { key: 'name', label: label('columns.name'), cardRole: 'primary', render: (user) => user.displayName },
    { key: 'email', label: label('columns.email'), render: (user) => user.email },
    { key: 'status', label: label('columns.status'), cardRole: 'status', render: (user) => badges([statusLabel(user.status)]) },
    { key: 'roles', label: label('columns.roles'), render: (user) => badges(user.roles.map((role) => `${roleLabel(role.role)} / ${role.blockName} / ${statusLabel(role.status)}`)) },
    { key: 'resident', label: label('columns.resident'), render: (user) => user.residentName ?? label('noResident') },
    { key: 'admins', label: label('columns.admins'), render: (user) => user.adminAccounts.map((account) => account.displayName).join(', ') || label('none') },
    { key: 'blocks', label: label('columns.blocks'), render: (user) => associatedBlocks(user).map((block) => block.blockName).join(', ') || label('none') },
    { key: 'apartments', label: label('columns.apartments'), render: (user) => user.apartments.map((apartment) => `${apartment.blockName} / ${apartment.staircaseName ? `${apartment.staircaseName} / ` : ''}${apartment.apartmentNumber}`).join(', ') || label('none') },
    { key: 'createdAt', label: label('columns.createdAt'), render: (user) => date(user.createdAt) },
    { key: 'actions', label: label('columns.actions'), actions: (user) => [
      { id: 'report', label: label('viewReport'), icon: <VisibilityIcon />, priority: 2, onClick: () => setReport({ user, tab: 0 }) },
      { id: 'resident', label: label('viewResident'), icon: <PersonIcon />, visible: Boolean(user.residentId), onClick: () => setReport({ user, tab: 1 }) },
    ] },
  ]
  const roleColumns: DataColumn<UserRoleAssociation>[] = [
    { key: 'role', label: label('columns.roles'), cardRole: 'primary', render: (role) => roleLabel(role.role) },
    { key: 'block', label: label('columns.blocks'), render: (role) => role.blockName },
    { key: 'status', label: label('columns.status'), render: (role) => statusLabel(role.status) },
    { key: 'created', label: label('columns.createdAt'), render: (role) => date(role.createdAt) },
    { key: 'suspended', label: label('suspendedAt'), render: (role) => date(role.suspendedAt) },
    { key: 'ended', label: label('endedAt'), render: (role) => date(role.endedAt) },
    { key: 'reason', label: label('suspensionReason'), render: (role) => role.suspensionReason || '-' },
  ]
  const adminColumns: DataColumn<UserAdminAssociation>[] = [
    { key: 'name', label: label('columns.name'), cardRole: 'primary', render: (account) => account.displayName },
    { key: 'status', label: label('columns.status'), render: (account) => statusLabel(account.status) },
    { key: 'subscription', label: label('subscription'), render: (account) => statusLabel(account.subscriptionStatus) },
    { key: 'blocks', label: label('columns.blocks'), render: (account) => account.blocks.map((block) => block.blockName).join(', ') || label('none') },
  ]
  const apartmentColumns: DataColumn<UserApartmentAssociation>[] = [
    { key: 'number', label: label('columns.apartments'), cardRole: 'primary', render: (apartment) => apartment.apartmentNumber },
    { key: 'block', label: label('columns.blocks'), render: (apartment) => apartment.blockName },
    { key: 'staircase', label: label('staircase'), render: (apartment) => apartment.staircaseName || '-' },
    { key: 'occupancy', label: label('livesHere'), render: (apartment) => label(apartment.livesHere ? 'yes' : 'no') },
  ]
  const blockColumns: DataColumn<UserBlockAssociation>[] = [
    { key: 'block', label: label('columns.blocks'), cardRole: 'primary', render: (block) => block.blockName },
  ]
  const disabled = Boolean(page.error || users.optionsError)
  const empty = <EmptyState headline={label(users.hasFilters ? 'filteredEmpty' : 'empty')}
    helperText={label(users.hasFilters ? 'filteredEmptyHelper' : 'emptyHelper')}
    {...(users.hasFilters ? { actionLabel: t('common.clearFilters'), onAction: users.clearFilters } : {})} />
  const reportEmpty = <EmptyState headline={label('noAssociations')} helperText={label('noAssociationsHelper')} />
  const user = report?.user
  return <Box>
    <PageHeader title={label('title')} />
    <Box sx={{ mb: 2 }}><FilterBar actions={<Button startIcon={<FilterAltOffIcon />} disabled={!users.hasFilters} onClick={users.clearFilters}>{t('common.clearFilters')}</Button>}>
      <SearchField size="small" label={label('filters.search')} value={users.search} disabled={disabled}
        onChange={(event) => users.setSearch(event.target.value)} onClear={() => users.setSearch('')} />
      <TextField select size="small" label={label('columns.blocks')} value={users.blockId} disabled={disabled || users.optionsLoading} onChange={(event) => users.setBlockId(event.target.value)}>
        <MenuItem value="">{t('common.all')}</MenuItem>
        {users.options?.blocks.map((block) => <MenuItem key={block.blockId} value={block.blockId}>{block.blockName}</MenuItem>)}
      </TextField>
      <TextField select size="small" label={label('columns.roles')} value={users.associatedRole} disabled={disabled} onChange={(event) => users.setAssociatedRole(event.target.value)}>
        <MenuItem value="">{t('common.all')}</MenuItem>
        {['Admin', 'Censor', 'Resident', 'none'].map((role) => <MenuItem key={role} value={role}>{role === 'none' ? label('noRoles') : roleLabel(role)}</MenuItem>)}
      </TextField>
      <TextField select size="small" label={label('columns.status')} value={users.status} disabled={disabled || users.optionsLoading} onChange={(event) => users.setStatus(event.target.value)}>
        <MenuItem value="">{t('common.all')}</MenuItem>
        {users.options?.statuses.map((status) => <MenuItem key={status} value={status}>{statusLabel(status)}</MenuItem>)}
      </TextField>
      <TextField select size="small" label={label('columns.resident')} value={users.profile} disabled={disabled} onChange={(event) => users.setProfile(event.target.value)}>
        <MenuItem value="">{t('common.all')}</MenuItem>
        <MenuItem value="linked">{label('filters.linked')}</MenuItem><MenuItem value="unlinked">{label('filters.unlinked')}</MenuItem>
      </TextField>
    </FilterBar></Box>
    {page.error || users.optionsError ? <LoadErrorState onRetry={users.refresh} />
      : (page.loading && !page.data) || users.optionsLoading ? <Box role="status" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 4 }}><CircularProgress size={24} /><Typography>{t('common.pagination.loading')}</Typography></Box>
        : !page.data?.totalCount ? empty : <Box aria-busy={page.loading} sx={{ position: 'relative' }}>
          {page.loading && <LinearProgress aria-label={t('common.pagination.loading')} />}
          <ResponsiveDataView ariaLabel={label('title')} columns={columns} rows={page.data.items} getRowId={(row) => row.userId}
            paginationId="SuperAdminUsers" desktopTableMinWidth={1200}
            serverPagination={{ page: page.data.pageNumber, totalCount: page.data.totalCount, loading: page.loading, onPageChange: page.setPage }} />
        </Box>}
    <AppDialog open={Boolean(report)} title={label('reportTitle')} cancelLabel={t('common.close')} confirmLabel={t('common.close')}
      hideCancelButton showCloseButton maxWidth="lg" onCancel={() => setReport(null)} onConfirm={() => setReport(null)} contentSx={{ display: 'grid', gap: 2, overflowWrap: 'anywhere' }}>
      {user && <>
        <Typography variant="h6">{user.displayName}</Typography>
        <Typography>{user.email} / {statusLabel(user.status)}</Typography>
        <Tabs value={report?.tab ?? 0} onChange={(_, tab: number) => setReport({ user, tab })} variant="fullWidth">
          <Tab id="user-associations-tab" aria-controls="user-associations-panel" label={label('associations')} />
          <Tab id="user-resident-tab" aria-controls="user-resident-panel" label={label('columns.resident')} disabled={!user.residentId} />
        </Tabs>
        {report?.tab === 0 ? <Box role="tabpanel" id="user-associations-panel" aria-labelledby="user-associations-tab" sx={{ display: 'grid', gap: 2 }}>
          <Typography variant="subtitle1">{label('columns.roles')}</Typography>
          <ResponsiveDataView columns={roleColumns} rows={user.roles} getRowId={(row) => row.roleId} ariaLabel={label('columns.roles')}
            paginationId={`user-roles-${user.userId}`} desktopTableMinWidth={950} emptyState={reportEmpty} />
          <Typography variant="subtitle1">{label('columns.admins')}</Typography>
          <ResponsiveDataView columns={adminColumns} rows={user.adminAccounts} getRowId={(row) => row.adminAccountId} ariaLabel={label('columns.admins')}
            paginationId={`user-admins-${user.userId}`} emptyState={reportEmpty} />
        </Box> : <Box role="tabpanel" id="user-resident-panel" aria-labelledby="user-resident-tab" sx={{ display: 'grid', gap: 2 }}>
          <Typography variant="h6">{user.residentName}</Typography>
          <Box component="dl" sx={{ m: 0, display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: '180px minmax(0, 1fr)' }, '& dd': { m: 0 } }}>
            <Typography component="dt">{label('columns.status')}</Typography><Typography component="dd">{user.residentStatus ? statusLabel(user.residentStatus) : '-'}</Typography>
            <Typography component="dt">{label('columns.email')}</Typography><Typography component="dd">{user.residentEmail || '-'}</Typography>
            <Typography component="dt">{label('phone')}</Typography><Typography component="dd">{user.phone || '-'}</Typography>
          </Box>
          <Typography variant="subtitle1">{label('memberships')}</Typography>
          <ResponsiveDataView columns={blockColumns} rows={user.residentBlocks} getRowId={(row) => row.blockId} ariaLabel={label('memberships')}
            paginationId={`user-memberships-${user.userId}`} emptyState={reportEmpty} />
          <Typography variant="subtitle1">{label('columns.apartments')}</Typography>
          <ResponsiveDataView columns={apartmentColumns} rows={user.apartments} getRowId={(row) => row.apartmentId} ariaLabel={label('columns.apartments')}
            paginationId={`user-apartments-${user.userId}`} emptyState={reportEmpty} />
        </Box>}
      </>}
    </AppDialog>
  </Box>
}

export default SuperAdminUsers
