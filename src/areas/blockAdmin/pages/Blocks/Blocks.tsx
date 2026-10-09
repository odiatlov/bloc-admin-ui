import React from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import ApartmentIcon from '@mui/icons-material/Apartment'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { useTranslation } from 'react-i18next'
import ConfirmationDialog from '../../../../components/shared/ConfirmationDialog'
import EmptyState from '../../../../components/shared/EmptyState'
import FilterBar from '../../../../components/shared/FilterBar'
import LoadErrorState from '../../../../components/shared/LoadErrorState'
import PageHeader from '../../../../components/shared/PageHeader'
import SearchField from '../../../../components/shared/SearchField'
import { type DataColumn } from '../../../../components/shared/ResponsiveDataView'
import PagedResponsiveDataView from '../../../../components/shared/PagedResponsiveDataView'
import { RoleContext } from '../../../../contexts/RoleContext'
import { useBlocks } from '../../../../hooks/useBlocks'
import { formatCurrency } from '../../../../hooks/useApartmentData'
import { blocksApi } from '../../../../services/blocksApi'
import type { BlockOverview, CreateBlockRequest } from '../../../../types/block'
import BlockDialog from './BlockDialog'
import BlockSetupWizard from './BlockSetupWizard'
import type { BlockSetupRequest } from '../../../../types/block'

const tableEmptyValue = '-'

const Blocks: React.FC = () => {
  const { t } = useTranslation()
  const { refreshAccounts } = React.useContext(RoleContext)
  const databaseOverview = useBlocks()
  const blocks = databaseOverview.blocks
  const search = databaseOverview.search
  const setSearch = databaseOverview.setSearch
  const error = databaseOverview.error
  const isLoading = databaseOverview.isLoading
  const [dialogMode, setDialogMode] = React.useState<'create' | 'edit' | null>(null)
  const [selectedBlock, setSelectedBlock] = React.useState<BlockOverview | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<BlockOverview | null>(null)
  const [isDeletingBlock, setIsDeletingBlock] = React.useState(false)
  const [notification, setNotification] = React.useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  } | null>(null)
  const closeNotification = () => {
    setNotification((current) => current ? { ...current, open: false } : null)
  }
  const isMutating = isDeletingBlock || dialogMode !== null
  const isEmpty = !isLoading && !error && databaseOverview.totalBlocks === 0
  const isSearchEmpty = !isLoading && !error && databaseOverview.totalBlocks > 0 && blocks.length === 0

  React.useEffect(() => {
    if (selectedBlock && !databaseOverview.blocks.some((block) => block.id === selectedBlock.id)) {
      window.setTimeout(() => {
        setSelectedBlock(null)
        setDialogMode(null)
      }, 0)
    }
    if (deleteTarget && !databaseOverview.blocks.some((block) => block.id === deleteTarget.id)) {
      window.setTimeout(() => {
        setDeleteTarget(null)
      }, 0)
    }
  }, [databaseOverview.blocks, deleteTarget, selectedBlock])

  const refreshAfterMutation = async () => {
    const blocksRefreshed = await databaseOverview.refresh()
    try {
      await refreshAccounts()
    } catch {
      // refreshAccounts owns its visible account error state
    }

    return blocksRefreshed
  }

  const openCreateDialog = () => {
    setSelectedBlock(null)
    setDialogMode('create')
  }

  const openEditDialog = (block: BlockOverview) => {
    setSelectedBlock(block)
    setDialogMode('edit')
  }

  const saveBlock = async (request: CreateBlockRequest) => {
    try {
      if (dialogMode === 'edit' && selectedBlock) {
        await blocksApi.updateBlock(selectedBlock.id, request)
      } else {
        await blocksApi.createBlock(request)
      }

      const refreshed = await refreshAfterMutation().catch(() => false)
      setDialogMode(null)
      setSelectedBlock(null)
      setNotification({
        open: true,
        message: refreshed
          ? t(dialogMode === 'edit' ? 'settings.blockDialog.updateSuccess' : 'settings.blockDialog.createSuccess')
          : t('blocks.errors.refreshAfterSave'),
        severity: refreshed ? 'success' : 'error',
      })
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : t('settings.blockDialog.serverError')
      setNotification({ open: true, message, severity: 'error' })
      throw submitError
    }
  }

  const saveSetup = async (request: BlockSetupRequest) => {
    await blocksApi.createSetup(request)
    setDialogMode(null)
    setSelectedBlock(null)
    const refreshed = await refreshAfterMutation().catch(() => false)
    setNotification({ open: true, message: refreshed ? t('settings.blockDialog.createSuccess') : t('blocks.errors.refreshAfterSave'), severity: refreshed ? 'success' : 'error' })
  }

  const deleteBlock = async () => {
    if (!deleteTarget || isDeletingBlock) return

    setIsDeletingBlock(true)

    try {
      await blocksApi.deleteBlock(deleteTarget.id)
      const refreshed = await refreshAfterMutation()
      setDeleteTarget(null)
      setNotification({
        open: true,
        message: refreshed ? t('settings.blockDialog.deleteSuccess') : t('blocks.errors.refreshAfterDelete'),
        severity: refreshed ? 'success' : 'error',
      })
    } catch (deleteError) {
      setNotification({
        open: true,
        message: deleteError instanceof Error ? deleteError.message : t('settings.blockDialog.deleteError'),
        severity: 'error',
      })
    } finally {
      setIsDeletingBlock(false)
    }
  }

  const columns: DataColumn<BlockOverview>[] = [
    { key: 'block', label: t('sidebar.blocks'), render: (block) => block.name ? t('common.blockValue', { block: block.name }) : tableEmptyValue },
    {
      key: 'admin',
      label: t('layout.topbar.role.admin'),
      render: (block) => block.administratorName || tableEmptyValue,
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
      actions: (block) => [
        { id: 'overview', label: t('blocks.actions.openOverview'), icon: <ApartmentIcon />, to: `/admin/blocks/${block.id}/Overview`, disabled: isMutating, priority: 2 },
        { id: 'edit', label: t('settings.actions.editBlock'), icon: <EditIcon />, onClick: () => openEditDialog(block), disabled: isMutating, priority: 1 },
        { id: 'delete', label: t('settings.actions.deleteBlock'), icon: <DeleteIcon />, onClick: () => setDeleteTarget(block), disabled: isMutating, color: 'error' },
      ],
    },
  ]

  return (
    <Box>
      <PageHeader title={t('pages.blocks.title')} description={t('pages.blocks.description')} />

      <Box sx={{ display: 'grid', gap: 2 }}>
        <FilterBar
          actions={(
            <Button
              disabled={Boolean(error)}
              onClick={openCreateDialog}
              startIcon={<AddIcon />}
              variant="contained"
            >
              {t('settings.actions.addBlock')}
            </Button>
          )}
        >
          <SearchField
            size="small"
            label={t('sidebar.searchBlocks')}
            value={search}
            onClear={() => setSearch('')}
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
            onAction={openCreateDialog}
            headline={t('emptyState.headline', { information: t('emptyState.information.blocks') })}
            helperText={t('blocks.empty.helperText')}
          />
        ) : isSearchEmpty ? (
          <EmptyState
            headline={t('blocks.empty.noSearchResults')}
            helperText={t('blocks.empty.noSearchResultsHelper')}
          />
        ) : (
          <PagedResponsiveDataView endpoint="/blocks/overview/page" query={{ search }}
            paginationId="Blocks-1"
            paginationResetKey={search}
            ariaLabel={t('pages.blocks.title')}
            columns={columns}
            desktopTableMinWidth={1200}
            getRowId={(block) => block.id}
            rows={blocks}
          />
        )}
      </Box>
      <BlockDialog
        block={dialogMode === 'edit' ? selectedBlock : null}
        open={dialogMode === 'edit'}
        onClose={() => {
          setDialogMode(null)
          setSelectedBlock(null)
        }}
        onSubmit={saveBlock}
      />
      {dialogMode === 'create' && <BlockSetupWizard onClose={() => setDialogMode(null)} onSimple={saveBlock} onSetup={saveSetup} />}
      <ConfirmationDialog
        cancelLabel={t('common.cancel')}
        confirmDisabled={isDeletingBlock}
        confirmLabel={isDeletingBlock ? t('settings.blockDialog.deleting') : t('settings.blockDialog.deleteConfirmYes')}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void deleteBlock()}
        open={Boolean(deleteTarget)}
        title={t('settings.blockDialog.deleteTitle')}
      >
        <Typography>
          {t('settings.blockDialog.deleteConfirm', {
            block: deleteTarget?.name ?? '',
          })}
        </Typography>
      </ConfirmationDialog>
      <Snackbar
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        autoHideDuration={4000}
        open={notification?.open ?? false}
        onClose={closeNotification}
      >
        <Alert
          severity={notification?.severity ?? 'success'}
          variant="filled"
          onClose={closeNotification}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Blocks
