import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/shared/PageHeader'
import ResponsiveDataView, { type DataColumn } from '../../components/shared/ResponsiveDataView'
import { mockPlatformBlocks, type PlatformBlockRow } from '../../mocks/superAdmin'

const SuperAdminBlocks: React.FC = () => {
  const { t } = useTranslation()

  const columns: DataColumn<PlatformBlockRow>[] = [
    { key: 'name', label: t('superAdmin.blocks.columns.name'), cardRole: 'primary', render: (block) => block.name },
    { key: 'address', label: t('superAdmin.blocks.columns.address'), render: (block) => block.address },
    { key: 'activeAdmin', label: t('superAdmin.blocks.columns.activeAdmin'), render: (block) => block.activeAdmin },
    { key: 'censor', label: t('superAdmin.blocks.columns.censor'), render: (block) => block.censor },
    { key: 'apartmentsCount', label: t('superAdmin.blocks.columns.apartmentsCount'), render: (block) => block.apartmentsCount },
    { key: 'staircasesCount', label: t('superAdmin.blocks.columns.staircasesCount'), render: (block) => block.staircasesCount },
    { key: 'residentsCount', label: t('superAdmin.blocks.columns.residentsCount'), render: (block) => block.residentsCount },
    { key: 'createdAt', label: t('superAdmin.common.createdAt'), render: (block) => block.createdAt },
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
      <ResponsiveDataView
        ariaLabel={t('superAdmin.blocks.title')}
        columns={columns}
        desktopTableMinWidth={1200}
        getRowId={(block) => block.id}
        rows={mockPlatformBlocks}
      />
    </Box>
  )
}

export default SuperAdminBlocks
