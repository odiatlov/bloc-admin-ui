import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useTranslation } from 'react-i18next'
import EmptyState from '../../../../components/shared/EmptyState'
import LoadErrorState from '../../../../components/shared/LoadErrorState'
import PageHeader from '../../../../components/shared/PageHeader'
import ResponsiveDataView, { type DataColumn } from '../../../../components/shared/ResponsiveDataView'
import { superAdminApi, type SuperAdminBlockResponse } from '../../../../services/superAdminApi'

const tableEmptyValue = '-'

const SuperAdminBlocks: React.FC = () => {
  const { t } = useTranslation()
  const [blocks, setBlocks] = React.useState<SuperAdminBlockResponse[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const loadBlocks = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      setBlocks(await superAdminApi.getBlocks())
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load platform blocks')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadBlocks()
  }, [loadBlocks])

  const columns: DataColumn<SuperAdminBlockResponse>[] = [
    { key: 'name', label: t('superAdmin.blocks.columns.name'), cardRole: 'primary', render: (block) => t('common.blockValue', { block: block.blockName }) },
    { key: 'address', label: t('superAdmin.blocks.columns.address'), render: (block) => block.address },
    { key: 'activeAdmin', label: t('superAdmin.blocks.columns.activeAdmin'), render: (block) => block.managedByUserName ?? tableEmptyValue },
    { key: 'censor', label: t('superAdmin.blocks.columns.censor'), render: (block) => block.censorName ?? tableEmptyValue },
    { key: 'apartmentsCount', label: t('superAdmin.blocks.columns.apartmentsCount'), render: (block) => block.apartmentCount },
    { key: 'staircasesCount', label: t('superAdmin.blocks.columns.staircasesCount'), render: (block) => block.staircaseCount },
    { key: 'residentsCount', label: t('superAdmin.blocks.columns.residentsCount'), render: (block) => block.residentCount },
    { key: 'createdAt', label: t('superAdmin.common.createdAt'), render: (block) => block.createdAt.slice(0, 10) },
    {
      key: 'actions',
      label: t('common.actions'),
      cardRole: 'actions',
      render: () => (
        <>
          <Button size="small" startIcon={<VisibilityIcon />}>{t('superAdmin.blocks.actions.viewDetails')}</Button>
          <Button size="small" startIcon={<AssignmentIndIcon />}>{t('superAdmin.blocks.actions.assignAdmin')}</Button>
          <Button size="small" startIcon={<FileDownloadIcon />}>{t('superAdmin.blocks.actions.exportBlockData')}</Button>
        </>
      ),
    },
  ]

  return (
    <Box>
      <PageHeader title={t('superAdmin.blocks.title')} description={t('superAdmin.blocks.description')} />
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
        <ResponsiveDataView
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
