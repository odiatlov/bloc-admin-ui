import React from 'react'
import { usePageFilter } from '../../../../hooks/usePageFilter'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Typography from '@mui/material/Typography'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useTranslation } from 'react-i18next'
import ActionBar from '../../../../components/shared/ActionBar'
import EmptyState from '../../../../components/shared/EmptyState'
import LoadErrorState from '../../../../components/shared/LoadErrorState'
import PageHeader from '../../../../components/shared/PageHeader'
import SearchField from '../../../../components/shared/SearchField'
import { type DataColumn } from '../../../../components/shared/ResponsiveDataView'
import PagedResponsiveDataView from '../../../../components/shared/PagedResponsiveDataView'
import { superAdminApi, type SuperAdminAdminAccountResponse, type SuperAdminBlockResponse } from '../../../../services/superAdminApi'
import CreateForAdmin from '../../components/CreateForAdmin'

const tableEmptyValue = '-'
const displayValue = (value?: string | null) => value?.trim() || tableEmptyValue

const SuperAdminBlocks: React.FC = () => {
  const { t } = useTranslation()
  const [blocks, setBlocks] = React.useState<SuperAdminBlockResponse[]>([])
  const [admins, setAdmins] = React.useState<SuperAdminAdminAccountResponse[]>([])
  const [search, setSearch] = usePageFilter('platformBlocks.search', '')
  const [blockId, setBlockId] = usePageFilter('platformBlocks.block', 'all')
  const [adminId, setAdminId] = usePageFilter('platformBlocks.admin', 'all')
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const loadBlocks = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [nextBlocks, nextAdmins] = await Promise.all([superAdminApi.getBlocks(), superAdminApi.getAdminAccounts()])
      setBlocks(nextBlocks)
      setAdmins(nextAdmins)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load platform blocks')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const timer = window.setTimeout(() => { void loadBlocks() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadBlocks])

  const selectedBlockId = blocks.some(block => block.blockId === blockId) ? blockId : 'all'
  const selectedAdminId = admins.some(admin => admin.adminAccountId === adminId) ? adminId : 'all'
  const hasFilters = Boolean(search.trim() || selectedBlockId !== 'all' || selectedAdminId !== 'all')
  const clearFilters = () => { setSearch(''); setBlockId('all'); setAdminId('all') }

  const columns: DataColumn<SuperAdminBlockResponse>[] = [
    { key: 'name', label: t('superAdmin.blocks.columns.name'), cardRole: 'primary', render: (block) => block.blockName ? t('common.blockValue', { block: block.blockName }) : tableEmptyValue },
    { key: 'address', label: t('superAdmin.blocks.columns.address'), render: (block) => displayValue(block.address) },
    { key: 'activeAdmin', label: t('superAdmin.blocks.columns.activeAdmin'), render: (block) => displayValue(block.adminAccountName) },
    { key: 'censor', label: t('superAdmin.blocks.columns.censor'), render: (block) => displayValue(block.censorName) },
    { key: 'apartmentsCount', label: t('superAdmin.blocks.columns.apartmentsCount'), render: (block) => block.apartmentCount },
    { key: 'staircasesCount', label: t('superAdmin.blocks.columns.staircasesCount'), render: (block) => block.staircaseCount },
    { key: 'residentsCount', label: t('superAdmin.blocks.columns.residentsCount'), render: (block) => block.residentCount },
    { key: 'createdAt', label: t('superAdmin.common.createdAt'), render: (block) => block.createdAt ? block.createdAt.slice(0, 10) : tableEmptyValue },
    {
      key: 'actions',
      label: t('common.actions'),
      cardRole: 'actions',
      actions: (block) => [
        { id: 'details', label: t('superAdmin.blocks.actions.viewDetails'), icon: <VisibilityIcon />, to: `/superadmin/blocks/${block.blockId}/apartments`, priority: 2 },
        { id: 'assign', label: t('superAdmin.blocks.actions.assignAdmin'), icon: <AssignmentIndIcon />, priority: 1 },
        { id: 'export', label: t('superAdmin.blocks.actions.exportBlockData'), icon: <FileDownloadIcon /> },
      ],
    },
  ]

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <PageHeader title={t('superAdmin.blocks.title')} description={t('superAdmin.blocks.description')} />
      <ActionBar title={<>
        <SearchField label={t('superAdmin.blocks.filters.search')} size="small" value={search}
          onChange={event => setSearch(event.target.value)} onClear={() => setSearch('')}
          disabled={isLoading || Boolean(error)} sx={{ width: { xs: '100%', sm: 260 } }} />
        <FormControl size="small" disabled={isLoading || Boolean(error)} sx={{ width: { xs: '100%', sm: 200 } }}>
          <InputLabel>{t('settings.fields.block')}</InputLabel>
          <Select label={t('settings.fields.block')} value={selectedBlockId} onChange={event => setBlockId(event.target.value)}>
            <MenuItem value="all">{t('common.all')}</MenuItem>
            {blocks.map(block => <MenuItem key={block.blockId} value={block.blockId}>{block.blockName}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" disabled={isLoading || Boolean(error)} sx={{ width: { xs: '100%', sm: 220 } }}>
          <InputLabel>{t('settings.blockDialog.administrator')}</InputLabel>
          <Select label={t('settings.blockDialog.administrator')} value={selectedAdminId} onChange={event => setAdminId(event.target.value)}>
            <MenuItem value="all">{t('common.all')}</MenuItem>
            {admins.map(admin => <MenuItem key={admin.adminAccountId} value={admin.adminAccountId}>{admin.ownerName}</MenuItem>)}
          </Select>
        </FormControl>
      </>}><CreateForAdmin kind="block" initialAdminId={selectedAdminId === 'all' ? undefined : selectedAdminId} onCreated={loadBlocks} /></ActionBar>
      {isLoading ? (
        <Paper sx={{ alignItems: 'center', display: 'grid', gap: 1.5, justifyItems: 'center', p: 4 }}>
          <CircularProgress size={32} />
          <Typography color="text.secondary">{t('superAdmin.blocks.loading')}</Typography>
        </Paper>
      ) : error ? (
        <LoadErrorState helperText={t('superAdmin.blocks.errors.loadFailed')} onRetry={loadBlocks} />
      ) : blocks.length === 0 ? (
        <EmptyState
          actionLabel={t('loadErrorState.retry')}
          headline={t('superAdmin.blocks.empty.headline')}
          helperText={t('superAdmin.blocks.empty.helperText')}
          onAction={loadBlocks}
        />
      ) : (
        <PagedResponsiveDataView endpoint="/super-admin/blocks/page"
          query={{ search, blockId: selectedBlockId === 'all' ? undefined : selectedBlockId, adminAccountId: selectedAdminId === 'all' ? undefined : selectedAdminId }}
          paginationId="SuperAdminBlocks-1"
          paginationResetKey={JSON.stringify([search, selectedBlockId, selectedAdminId])}
          emptyState={hasFilters ? <EmptyState headline={t('blockOverviewFilters.noResults')}
            helperText={t('blockOverviewFilters.noResultsHelper')} actionLabel={t('common.clearFilters')} onAction={clearFilters} /> : undefined}
          ariaLabel={t('superAdmin.blocks.title')}
          columns={columns}
          desktopTableMinWidth={1200}
          getRowId={(block) => block.blockId}
          rows={blocks}
        />
      )}
    </Box>
  )
}

export default SuperAdminBlocks
