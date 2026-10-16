import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Link as RouterLink, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ApartmentOverviewFilters from '../../../../components/apartments/ApartmentOverviewFilters'
import { useApartmentColumns } from '../../../../components/apartments/useApartmentColumns'
import EmptyState from '../../../../components/shared/EmptyState'
import LoadErrorState from '../../../../components/shared/LoadErrorState'
import PageHeader from '../../../../components/shared/PageHeader'
import ResponsiveDataView from '../../../../components/shared/ResponsiveDataView'
import { RoleContext } from '../../../../contexts/RoleContext'
import { getApartmentFloorOptions } from '../../../../domain/apartmentOverview'
import { usePagedList } from '../../../../hooks/usePagedList'
import type { SuperAdminBlockApartmentFiltersResponse } from '../../../../services/superAdminApi'
import type { ApartmentResponse } from '../../../../types/management'
import { useSuperAdminBlockApartmentFilters } from '../../hooks/useSuperAdminBlockApartmentFilters'

const LoadingState = () => {
  const { t } = useTranslation()
  return <Box role="status" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 4 }}>
    <CircularProgress size={24} />
    <Typography color="text.secondary">{t('common.pagination.loading')}</Typography>
  </Box>
}

const BlockApartmentOverview = ({ filters, backToBlocks }: {
  filters: SuperAdminBlockApartmentFiltersResponse
  backToBlocks: React.ReactNode
}) => {
  const { t } = useTranslation()
  const columns = useApartmentColumns()
  const [search, setSearch] = React.useState('')
  const [staircaseId, setStaircaseId] = React.useState('all')
  const [floor, setFloor] = React.useState('all')
  const floors = getApartmentFloorOptions(filters.floors, staircaseId)
  const activeFloor = floors.includes(floor) ? floor : 'all'
  const paginationId = `SuperAdminBlockApartments-${filters.blockId}`
  const query = {
    blockId: filters.blockId,
    search,
    staircaseId: staircaseId === 'all' ? undefined : staircaseId,
    floor: activeFloor === 'all' || activeFloor === 'unassigned' ? undefined : Number(activeFloor),
    unassignedFloor: activeFloor === 'unassigned',
  }
  const page = usePagedList<ApartmentResponse>(paginationId, '/apartments/page', query, JSON.stringify(filters))
  const hasFilters = Boolean(search.trim() || staircaseId !== 'all' || activeFloor !== 'all')
  const clearFilters = () => { setSearch(''); setStaircaseId('all'); setFloor('all') }

  return <Box sx={{ display: 'grid', gap: 2 }}>
    <ApartmentOverviewFilters search={search} onSearchChange={setSearch}
      staircaseId={staircaseId} onStaircaseChange={(value) => { setStaircaseId(value); setFloor('all') }}
      staircases={filters.staircases} hasStaircases={filters.hasStaircases || filters.staircases.length > 0}
      floor={activeFloor} onFloorChange={setFloor} floors={floors} disabled={Boolean(page.error)} actions={backToBlocks} />
    {page.error ? <LoadErrorState helperText={t('apartments.errors.loadFailed')} onRetry={page.refresh} />
      : page.loading && !page.data ? <LoadingState />
        : !page.data?.totalCount ? <EmptyState
          headline={t(hasFilters ? 'blockOverviewFilters.noResults' : 'superAdmin.blocks.apartments.emptyHeadline')}
          helperText={t(hasFilters ? 'blockOverviewFilters.noResultsHelper' : 'superAdmin.blocks.apartments.emptyHelper')}
          {...(hasFilters ? { actionLabel: t('common.clearFilters'), onAction: clearFilters } : {})} />
          : <Box aria-busy={page.loading} sx={{ position: 'relative' }}>
            {page.loading && <LinearProgress aria-label={t('common.pagination.loading')} />}
            <ResponsiveDataView paginationId={paginationId} ariaLabel={t('superAdmin.blocks.apartments.title', { block: filters.blockName })}
              columns={columns} rows={page.data.items} getRowId={(apartment) => apartment.id} desktopTableMinWidth={1120}
              serverPagination={{ page: page.data.pageNumber, totalCount: page.data.totalCount, loading: page.loading, onPageChange: page.setPage }} />
          </Box>}
  </Box>
}

const BlockApartmentsPage = ({ blockId }: { blockId: string }) => {
  const { t } = useTranslation()
  const filters = useSuperAdminBlockApartmentFilters(blockId)
  const backToBlocks = <Button startIcon={<ArrowBackIcon />} variant="contained" component={RouterLink} to="/superadmin/blocks">
    {t('blocks.actions.backToList')}
  </Button>

  return <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
    <PageHeader title={filters.data ? t('superAdmin.blocks.apartments.title', { block: filters.data.blockName }) : t('sidebar.apartments')}
      description={t('superAdmin.blocks.apartments.description')}
      actions={filters.data ? undefined : backToBlocks} />
    {filters.loading ? <LoadingState />
      : filters.notFound ? <EmptyState headline={t('superAdmin.blocks.apartments.notFoundHeadline')} helperText={t('superAdmin.blocks.apartments.notFoundHelper')} />
        : filters.error ? <LoadErrorState helperText={t('superAdmin.blocks.errors.loadFailed')} onRetry={filters.refresh} />
          : filters.data && <BlockApartmentOverview filters={filters.data} backToBlocks={backToBlocks} />}
  </Box>
}

const SuperAdminBlockApartments = () => {
  const { blockId } = useParams()
  const { account, token } = React.useContext(RoleContext)
  if (!blockId) return <Navigate to="/superadmin/blocks" replace />
  return <BlockApartmentsPage key={JSON.stringify([blockId, account.id, token])} blockId={blockId} />
}

export default SuperAdminBlockApartments
