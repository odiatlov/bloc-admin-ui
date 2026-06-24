import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import ApartmentIcon from '@mui/icons-material/Apartment'
import SettingsIcon from '@mui/icons-material/Settings'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import EmptyState from '../../components/shared/EmptyState'
import FilterBar from '../../components/shared/FilterBar'
import LoadErrorState from '../../components/shared/LoadErrorState'
import PageHeader from '../../components/shared/PageHeader'
import ResponsiveDataView, { type DataColumn } from '../../components/shared/ResponsiveDataView'
import { RoleContext } from '../../contexts/RoleContext'
import { useBlocks } from '../../hooks/useBlocks'
import { formatCurrency, useBlocksOverview } from '../../hooks/useApartmentData'
import type { BlockOverview } from '../../types/block'

const Blocks: React.FC = () => {
  const { t } = useTranslation()
  const { account } = React.useContext(RoleContext)
  const shouldUseDatabaseBlocks = account.id === 'acct-demo'
  const databaseOverview = useBlocks({ enabled: shouldUseDatabaseBlocks })
  const mockOverview = useBlocksOverview()

  const mockBlocks = React.useMemo<BlockOverview[]>(
    () => mockOverview.blockOverviews.map((overview) => ({
      id: overview.block.id,
      name: overview.block.name,
      displayName: t('common.blockValue', { block: overview.block.name }),
      administratorName: overview.activeAdmin?.name ?? null,
      hasStaircases: overview.block.hasStaircases,
      address: overview.block.address ?? null,
      createdAt: '',
      apartmentCount: overview.apartmentCount,
      residentCount: overview.residentCount,
      staircaseCount: overview.staircaseCount,
      totalInvoicesAmount: overview.totalInvoices,
      totalPaymentsAmount: overview.totalPayments,
      unpaidBalance: overview.unpaidBalance,
    })),
    [mockOverview.blockOverviews, t],
  )

  const blocks = shouldUseDatabaseBlocks ? databaseOverview.blocks : mockBlocks
  const search = shouldUseDatabaseBlocks ? databaseOverview.search : mockOverview.search
  const setSearch = shouldUseDatabaseBlocks ? databaseOverview.setSearch : mockOverview.setSearch
  const error = shouldUseDatabaseBlocks ? databaseOverview.error : null
  const isLoading = shouldUseDatabaseBlocks && databaseOverview.isLoading
  const isEmpty = !isLoading && !error && blocks.length === 0

  const columns: DataColumn<BlockOverview>[] = [
    { key: 'block', label: t('sidebar.blocks'), render: (block) => block.displayName },
    {
      key: 'admin',
      label: t('layout.topbar.role.admin'),
      render: (block) => block.administratorName ?? t('common.notAvailable'),
    },
    { key: 'apartments', label: t('dashboard.admin.overview.apartments'), render: (block) => block.apartmentCount },
    { key: 'residents', label: t('dashboard.admin.overview.residents'), render: (block) => block.residentCount },
    { key: 'staircases', label: t('sidebar.staircases'), render: (block) => block.staircaseCount },
    {
      key: 'invoices',
      label: t('blocks.metrics.totalInvoices'),
      render: (block) => formatCurrency(block.totalInvoicesAmount),
    },
    {
      key: 'payments',
      label: t('blocks.metrics.totalPayments'),
      render: (block) => formatCurrency(block.totalPaymentsAmount),
    },
    {
      key: 'unpaid',
      label: t('blocks.metrics.unpaid'),
      render: (block) => formatCurrency(block.unpaidBalance),
    },
    {
      key: 'actions',
      label: t('common.actions'),
      render: (block) => (
        <Button size="small" startIcon={<ApartmentIcon />} component={RouterLink} to={`/admin/blocks/${block.id}/apartments`}>
          {t('blocks.actions.openOverview')}
        </Button>
      ),
    },
  ]

  return (
    <Box>
      <PageHeader title={t('pages.blocks.title')} description={t('pages.blocks.description')} />

      <Box sx={{ display: 'grid', gap: 2 }}>
        <FilterBar
          actions={(
            <Button
              component={RouterLink}
              startIcon={<SettingsIcon />}
              to="/admin/settings"
              variant="contained"
            >
              {t('blocks.actions.configureBlocks')}
            </Button>
          )}
        >
          <TextField
            size="small"
            label={t('sidebar.searchBlocks')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            disabled={Boolean(error)}
            sx={{ minWidth: { sm: 320 } }}
          />
        </FilterBar>

        {isLoading ? (
          <Paper sx={{ alignItems: 'center', display: 'grid', gap: 1.5, justifyItems: 'center', p: 4 }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary">{t('blocks.loading')}</Typography>
          </Paper>
        ) : error ? (
          <LoadErrorState
            helperText={t('blocks.errors.loadFailed')}
            onRetry={databaseOverview.refresh}
          />
        ) : isEmpty ? (
          <EmptyState
            actionLabel={t('emptyState.action', { information: t('emptyState.information.blocks') })}
            actionTo="/admin/settings"
            headline={t('emptyState.headline', { information: t('emptyState.information.blocks') })}
            helperText={t('emptyState.helper.settings', { information: t('emptyState.information.blocks') })}
          />
        ) : (
          <ResponsiveDataView
            ariaLabel={t('pages.blocks.title')}
            columns={columns}
            desktopTableMinWidth={1200}
            getRowId={(block) => block.id}
            rows={blocks}
          />
        )}
      </Box>
    </Box>
  )
}

export default Blocks
