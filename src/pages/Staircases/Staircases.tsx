import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { useTranslation } from 'react-i18next'
import AppDialog from '../../components/shared/AppDialog'
import ConfirmationDialog from '../../components/shared/ConfirmationDialog'
import EmptyState from '../../components/shared/EmptyState'
import FilterBar from '../../components/shared/FilterBar'
import LoadErrorState from '../../components/shared/LoadErrorState'
import PageHeader from '../../components/shared/PageHeader'
import ResponsiveDataView, { type DataColumn } from '../../components/shared/ResponsiveDataView'
import { useBlocks } from '../../hooks/useBlocks'
import { staircasesApi } from '../../services/staircasesApi'
import type { StaircaseResponse } from '../../types/management'

const tableEmptyValue = '-'

const Staircases: React.FC = () => {
  const { t } = useTranslation()
  const databaseBlocks = useBlocks()
  const [staircases, setStaircases] = React.useState<StaircaseResponse[]>([])
  const [selectedBlockId, setSelectedBlockId] = React.useState('all')
  const [search, setSearch] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [dialogMode, setDialogMode] = React.useState<'create' | 'edit' | null>(null)
  const [editingStaircase, setEditingStaircase] = React.useState<StaircaseResponse | null>(null)
  const [deletingStaircase, setDeletingStaircase] = React.useState<StaircaseResponse | null>(null)
  const [isDeletingStaircase, setIsDeletingStaircase] = React.useState(false)
  const [form, setForm] = React.useState({ blockId: '', name: '' })

  const blocks = databaseBlocks.blocks

  const loadStaircases = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      setStaircases(await staircasesApi.getAll())
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load staircases')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadStaircases()
  }, [loadStaircases])

  const filteredRows = React.useMemo(() => {
    const query = search.trim().toLowerCase()

    return staircases.filter((staircase) => {
      const matchesBlock = selectedBlockId === 'all' || staircase.blockId === selectedBlockId
      const matchesSearch = !query || [staircase.name, staircase.blockName].some((value) => value.toLowerCase().includes(query))
      return matchesBlock && matchesSearch
    })
  }, [staircases, search, selectedBlockId])

  const openCreateDialog = () => {
    setEditingStaircase(null)
    setForm({ blockId: blocks[0]?.id ?? '', name: '' })
    setDialogMode('create')
  }

  const openEditDialog = (staircase: StaircaseResponse) => {
    setEditingStaircase(staircase)
    setForm({ blockId: staircase.blockId, name: staircase.name })
    setDialogMode('edit')
  }

  const saveStaircase = async () => {
    if (!form.blockId || !form.name.trim()) return

    if (dialogMode === 'edit' && editingStaircase) {
      await staircasesApi.update(editingStaircase.id, { blockId: form.blockId, name: form.name.trim() })
    } else {
      await staircasesApi.create({ blockId: form.blockId, name: form.name.trim() })
    }

    setDialogMode(null)
    await loadStaircases()
    void databaseBlocks.refresh()
  }

  const deleteStaircase = async () => {
    if (!deletingStaircase || deletingStaircase.apartmentCount > 0 || isDeletingStaircase) return

    setIsDeletingStaircase(true)
    setError(null)

    try {
      await staircasesApi.delete(deletingStaircase.id)
      setDeletingStaircase(null)
      await loadStaircases()
      void databaseBlocks.refresh()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to delete staircase')
    } finally {
      setIsDeletingStaircase(false)
    }
  }

  const columns: DataColumn<StaircaseResponse>[] = [
    { key: 'name', label: t('staircases.columns.name'), cardRole: 'primary', render: (staircase) => staircase.name ? t('settings.fields.staircaseName', { staircase: staircase.name }) : tableEmptyValue },
    { key: 'block', label: t('settings.fields.block'), cardRole: 'secondary', render: (staircase) => staircase.blockName || tableEmptyValue },
    { key: 'apartments', label: t('dashboard.admin.overview.apartments'), render: (staircase) => staircase.apartmentCount },
    { key: 'residents', label: t('dashboard.admin.overview.residents'), render: (staircase) => staircase.residentCount },
    {
      key: 'actions',
      label: t('common.actions'),
      cardRole: 'actions',
      render: (staircase) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button size="small" startIcon={<EditIcon />} onClick={() => openEditDialog(staircase)}>
            {t('staircases.actions.edit')}
          </Button>
          <Button
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => setDeletingStaircase(staircase)}
            disabled={isDeletingStaircase}
          >
            {t('staircases.actions.delete')}
          </Button>
        </Box>
      ),
    },
  ]

  const loadError = error || databaseBlocks.error
  const loading = isLoading || databaseBlocks.isLoading

  return (
    <Box>
      <PageHeader title={t('pages.staircases.title')} description={t('pages.staircases.description')} />

      <Box sx={{ display: 'grid', gap: 2 }}>
        <FilterBar
          actions={(
            <Button startIcon={<AddIcon />} variant="contained" onClick={openCreateDialog} disabled={blocks.length === 0}>
              {t('staircases.actions.add')}
            </Button>
          )}
        >
          <FormControl size="small" sx={{ minWidth: { sm: 180 } }} disabled={Boolean(loadError)}>
            <InputLabel>{t('settings.fields.block')}</InputLabel>
            <Select label={t('settings.fields.block')} value={selectedBlockId} onChange={(event: SelectChangeEvent) => setSelectedBlockId(event.target.value)}>
              <MenuItem value="all">{t('common.all')}</MenuItem>
              {blocks.map((block) => (
                <MenuItem key={block.id} value={block.id}>{block.displayName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label={t('staircases.filters.search')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            disabled={Boolean(loadError)}
            sx={{ minWidth: { sm: 280 } }}
          />
        </FilterBar>

        {loading ? (
          <Paper sx={{ alignItems: 'center', display: 'grid', gap: 1.5, justifyItems: 'center', p: 4 }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary">{t('staircases.loading')}</Typography>
          </Paper>
        ) : loadError ? (
          <LoadErrorState helperText={t('staircases.errors.loadFailed')} onRetry={() => { void loadStaircases(); void databaseBlocks.refresh() }} />
        ) : filteredRows.length === 0 ? (
          <EmptyState
            actionLabel={t('emptyState.action', { information: t('emptyState.information.staircases') })}
            headline={t('emptyState.headline', { information: t('emptyState.information.staircases') })}
            helperText={t('emptyState.helper.dedicated', { information: t('emptyState.information.staircases') })}
          />
        ) : (
          <ResponsiveDataView
            ariaLabel={t('pages.staircases.title')}
            columns={columns}
            desktopTableMinWidth={900}
            getRowId={(staircase) => staircase.id}
            rows={filteredRows}
          />
        )}
      </Box>

      <AppDialog
        cancelLabel={t('common.cancel')}
        confirmDisabled={!form.blockId || !form.name.trim()}
        confirmLabel={t('common.save')}
        contentSx={{ display: 'grid', gap: 2 }}
        onCancel={() => setDialogMode(null)}
        onConfirm={() => { void saveStaircase() }}
        open={Boolean(dialogMode)}
        title={dialogMode === 'edit' ? t('staircases.dialog.editTitle') : t('staircases.dialog.addTitle')}
      >
        <FormControl fullWidth size="small" required>
          <InputLabel>{t('settings.fields.block')}</InputLabel>
          <Select label={t('settings.fields.block')} value={form.blockId} onChange={(event: SelectChangeEvent) => setForm((value) => ({ ...value, blockId: event.target.value }))}>
            {blocks.map((block) => (
              <MenuItem key={block.id} value={block.id}>{block.displayName}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          required
          size="small"
          label={t('staircases.columns.name')}
          value={form.name}
          onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
        />
      </AppDialog>

      <ConfirmationDialog
        cancelLabel={t('common.cancel')}
        confirmDisabled={!deletingStaircase || deletingStaircase.apartmentCount > 0 || isDeletingStaircase}
        confirmLabel={isDeletingStaircase ? t('staircases.dialog.deleting') : t('staircases.dialog.deleteConfirmYes')}
        onCancel={() => setDeletingStaircase(null)}
        onConfirm={() => { void deleteStaircase() }}
        open={Boolean(deletingStaircase)}
        title={t('staircases.dialog.deleteTitle')}
      >
        <Typography color="text.secondary">
          {deletingStaircase?.apartmentCount
            ? t('staircases.dialog.deleteBlocked', {
                staircase: deletingStaircase.name,
                count: deletingStaircase.apartmentCount,
              })
            : t('staircases.dialog.deleteConfirm', {
                staircase: deletingStaircase?.name ?? '',
              })}
        </Typography>
      </ConfirmationDialog>
    </Box>
  )
}

export default Staircases
