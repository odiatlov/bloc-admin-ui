import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import EmptyState from '../../components/shared/EmptyState'
import PageHeader from '../../components/shared/PageHeader'
import ResponsiveDataView, { type DataColumn } from '../../components/shared/ResponsiveDataView'
import { formatCurrency, useBlocksOverview } from '../../hooks/useApartmentData'

const Blocks: React.FC = () => {
  const { t } = useTranslation()
  const { blockOverviews, search, setSearch } = useBlocksOverview()

  const columns: DataColumn<(typeof blockOverviews)[number]>[] = [
    { key: 'block', label: t('sidebar.blocks'), render: (overview) => t('common.blockValue', { block: overview.block.name }) },
    { key: 'admin', label: t('layout.topbar.role.admin'), render: (overview) => overview.activeAdmin?.name ?? t('common.notAvailable') },
    { key: 'apartments', label: t('dashboard.admin.overview.apartments'), render: (overview) => overview.apartmentCount },
    { key: 'residents', label: t('dashboard.admin.overview.residents'), render: (overview) => overview.residentCount },
    {
      key: 'staircases',
      label: t('sidebar.staircases'),
      render: (overview) => overview.block.hasStaircases ? overview.staircaseCount : t('common.notAvailable'),
    },
    { key: 'invoices', label: t('blocks.metrics.totalInvoices'), render: (overview) => formatCurrency(overview.totalInvoices) },
    { key: 'payments', label: t('blocks.metrics.totalPayments'), render: (overview) => formatCurrency(overview.totalPayments) },
    { key: 'unpaid', label: t('blocks.metrics.unpaid'), render: (overview) => formatCurrency(overview.unpaidBalance) },
    {
      key: 'actions',
      label: t('common.actions'),
      render: (overview) => (
        <Button size="small" component={RouterLink} to={`/admin/blocks/${overview.block.id}/overview`}>
          {t('blocks.actions.openOverview')}
        </Button>
      ),
    },
  ]

  return (
    <Box>
      <PageHeader title={t('pages.blocks.title')} description={t('pages.blocks.description')} />

      <Box sx={{ display: 'grid', gap: 2 }}>
        <Paper sx={{ p: 2, display: 'grid', gap: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            label={t('sidebar.searchBlocks')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Typography variant="body2" color="text.secondary">
            {t('blocks.results', { count: blockOverviews.length })}
          </Typography>
        </Paper>

        <ResponsiveDataView
          ariaLabel={t('pages.blocks.title')}
          columns={columns}
          desktopTableMinWidth={1200}
          emptyState={(
            <EmptyState
              actionLabel={t('emptyState.action', { information: t('emptyState.information.blocks') })}
              actionTo="/admin/settings"
              headline={t('emptyState.headline', { information: t('emptyState.information.blocks') })}
              helperText={t('emptyState.helper.settings', { information: t('emptyState.information.blocks') })}
            />
          )}
          getRowId={(overview) => overview.block.id}
          rows={blockOverviews}
        />
      </Box>
    </Box>
  )
}

export default Blocks
