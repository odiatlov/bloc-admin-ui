import React from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import ApartmentIcon from '@mui/icons-material/Apartment'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ConfirmationDialog from '../../../../components/shared/ConfirmationDialog'
import EmptyState from '../../../../components/shared/EmptyState'
import FilterBar from '../../../../components/shared/FilterBar'
import LoadErrorState from '../../../../components/shared/LoadErrorState'
import PageHeader from '../../../../components/shared/PageHeader'
import SearchField from '../../../../components/shared/SearchField'
import ResponsiveDataView, { type DataColumn } from '../../../../components/shared/ResponsiveDataView'
import { RoleContext } from '../../../../contexts/RoleContext'
import { useBlocks } from '../../../../hooks/useBlocks'
import { formatCurrency } from '../../../../hooks/useApartmentData'
import { blocksApi } from '../../../../services/blocksApi'
import type { BlockOverview, CreateBlockRequest } from '../../../../types/block'
import BlockDialog from './BlockDialog'

const tableEmptyValue = '-'

type BlockActionsProps = {
  block: BlockOverview
  disabled: boolean
  onDelete: (block: BlockOverview) => void
  onEdit: (block: BlockOverview) => void
}

const BlockActions: React.FC<BlockActionsProps> = ({
  block,
  disabled,
  onDelete,
  onEdit,
}) => {
  const { t } = useTranslation()
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
  const menuOpen = Boolean(anchorEl)
  const label = block.name ? t('common.blockValue', { block: block.name }) : block.displayName

  const closeMenu = () => setAnchorEl(null)

  return (
    <Box>
      <Box sx={{ alignItems: 'center', display: 'flex', gap: 0.75, minWidth: 0, width: '100%' }}>
        <Button
          size="small"
          startIcon={<ApartmentIcon />}
          component={RouterLink}
          to={`/admin/blocks/${block.id}/Overview`}
          disabled={disabled}
          sx={{ flex: 1, minWidth: 0 }}
        >
          {t('blocks.actions.openOverview')}
        </Button>
      <Tooltip title={t('blocks.actions.moreActions', { block: label })}>
        <Box component="span" sx={{ flexShrink: 0 }}>
          <IconButton
            aria-controls={menuOpen ? `block-actions-${block.id}` : undefined}
            aria-haspopup="menu"
            aria-label={t('blocks.actions.moreActions', { block: label })}
            disabled={disabled}
            onClick={(event) => setAnchorEl(event.currentTarget)}
            size="small"
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      </Tooltip>
      </Box>
      <Menu
        anchorEl={anchorEl}
        id={`block-actions-${block.id}`}
        onClose={closeMenu}
        open={menuOpen}
      >
        <MenuItem
          onClick={() => {
            closeMenu()
            onEdit(block)
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          {t('settings.actions.editBlock')}
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            closeMenu()
            onDelete(block)
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          {t('settings.actions.deleteBlock')}
        </MenuItem>
      </Menu>
    </Box>
  )
}

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
    message: string
    severity: 'success' | 'error'
  } | null>(null)
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

      const refreshed = await refreshAfterMutation()
      setDialogMode(null)
      setSelectedBlock(null)
      setNotification({
        message: refreshed
          ? t(dialogMode === 'edit' ? 'settings.blockDialog.updateSuccess' : 'settings.blockDialog.createSuccess')
          : t('blocks.errors.refreshAfterSave'),
        severity: refreshed ? 'success' : 'error',
      })
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : t('settings.blockDialog.serverError')
      setNotification({ message, severity: 'error' })
      throw submitError
    }
  }

  const deleteBlock = async () => {
    if (!deleteTarget || isDeletingBlock) return

    setIsDeletingBlock(true)

    try {
      await blocksApi.deleteBlock(deleteTarget.id)
      const refreshed = await refreshAfterMutation()
      setDeleteTarget(null)
      setNotification({
        message: refreshed ? t('settings.blockDialog.deleteSuccess') : t('blocks.errors.refreshAfterDelete'),
        severity: refreshed ? 'success' : 'error',
      })
    } catch (deleteError) {
      setNotification({
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
      render: (block) => (
        <BlockActions
          block={block}
          disabled={isMutating}
          onDelete={setDeleteTarget}
          onEdit={openEditDialog}
        />
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
          <ResponsiveDataView
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
        open={dialogMode !== null}
        onClose={() => {
          setDialogMode(null)
          setSelectedBlock(null)
        }}
        onSubmit={saveBlock}
      />
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
        open={Boolean(notification)}
        onClose={() => setNotification(null)}
      >
        <Alert
          severity={notification?.severity ?? 'success'}
          variant="filled"
          onClose={() => setNotification(null)}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Blocks
