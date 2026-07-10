import React from 'react'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../../components/shared/PageHeader'
import ResponsiveDataView, { type DataColumn } from '../../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../../components/shared/StatusChip'
import { translateResidentAccountStatus } from '../../../../domain/displayLabels'
import { mockPlatformUsers } from '../../mocks/platformMockData'
import type { PlatformResidentRow } from '../../types'

const SuperAdminResidents: React.FC = () => {
  const { t } = useTranslation()

  const columns: DataColumn<PlatformResidentRow>[] = [
    { key: 'name', label: t('superAdmin.residents.columns.name'), cardRole: 'primary', render: (resident) => resident.name },
    { key: 'email', label: t('superAdmin.residents.columns.email'), render: (resident) => resident.email },
    { key: 'phone', label: t('superAdmin.residents.columns.phone'), render: (resident) => resident.phone },
    { key: 'block', label: t('superAdmin.residents.columns.block'), render: (resident) => resident.block },
    { key: 'apartment', label: t('superAdmin.residents.columns.apartment'), render: (resident) => resident.apartment },
    {
      key: 'accountStatus',
      label: t('superAdmin.residents.columns.accountStatus'),
      cardRole: 'status',
      render: (resident) => <StatusChip status={resident.accountStatus} label={translateResidentAccountStatus(t, resident.accountStatus)} />,
    },
    { key: 'blockRole', label: t('superAdmin.residents.columns.blockRole'), render: (resident) => t(`superAdmin.residents.blockRole.${resident.blockRole}`) },
  ]

  return (
    <Box>
      <PageHeader title={t('superAdmin.residents.title')} description={t('superAdmin.residents.description')} />
      <ResponsiveDataView
        ariaLabel={t('superAdmin.residents.title')}
        columns={columns}
        desktopTableMinWidth={1100}
        getRowId={(resident) => resident.id}
        rows={mockPlatformUsers}
      />
    </Box>
  )
}

export default SuperAdminResidents
