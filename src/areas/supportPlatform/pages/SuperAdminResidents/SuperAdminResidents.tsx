import React from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import EmptyState from '../../../../components/shared/EmptyState'
import LoadErrorState from '../../../../components/shared/LoadErrorState'
import PageHeader from '../../../../components/shared/PageHeader'
import ResponsiveDataView, { type DataColumn } from '../../../../components/shared/ResponsiveDataView'
import StatusChip from '../../../../components/shared/StatusChip'
import { superAdminApi, type SuperAdminResidentResponse } from '../../../../services/superAdminApi'

const tableEmptyValue = '-'
const statusKey = (status: string) => status.charAt(0).toLowerCase() + status.slice(1)

const SuperAdminResidents: React.FC = () => {
  const { t } = useTranslation()
  const [residents, setResidents] = React.useState<SuperAdminResidentResponse[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const loadResidents = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      setResidents(await superAdminApi.getResidents())
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load platform residents')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadResidents()
  }, [loadResidents])

  const columns: DataColumn<SuperAdminResidentResponse>[] = [
    { key: 'name', label: t('superAdmin.residents.columns.name'), cardRole: 'primary', render: (resident) => resident.displayName },
    { key: 'email', label: t('superAdmin.residents.columns.email'), render: (resident) => resident.email },
    { key: 'phone', label: t('superAdmin.residents.columns.phone'), render: (resident) => resident.phone ?? tableEmptyValue },
    { key: 'block', label: t('superAdmin.residents.columns.block'), render: (resident) => resident.blockName ? t('common.blockValue', { block: resident.blockName }) : tableEmptyValue },
    { key: 'apartment', label: t('superAdmin.residents.columns.apartment'), render: (resident) => resident.apartmentNumber ?? tableEmptyValue },
    {
      key: 'accountStatus',
      label: t('superAdmin.residents.columns.accountStatus'),
      cardRole: 'status',
      render: (resident) => <StatusChip status={resident.accountStatus.toLowerCase()} label={t(`superAdmin.status.${statusKey(resident.accountStatus)}`)} />,
    },
    { key: 'blockRole', label: t('superAdmin.residents.columns.blockRole'), render: (resident) => t(`superAdmin.residents.blockRole.${resident.role}`) },
    { key: 'membershipStatus', label: t('superAdmin.residents.columns.membershipStatus'), render: (resident) => t(`superAdmin.status.${statusKey(resident.membershipStatus)}`) },
  ]

  return (
    <Box>
      <PageHeader title={t('superAdmin.residents.title')} description={t('superAdmin.residents.description')} />
      {isLoading ? (
        <Paper sx={{ alignItems: 'center', display: 'grid', gap: 1.5, justifyItems: 'center', p: 4 }}>
          <CircularProgress size={32} />
          <Typography color="text.secondary">{t('superAdmin.residents.loading')}</Typography>
        </Paper>
      ) : error ? (
        <LoadErrorState helperText={t('superAdmin.residents.errors.loadFailed')} onRetry={loadResidents} />
      ) : residents.length === 0 ? (
        <EmptyState
          actionLabel={t('loadErrorState.retry')}
          headline={t('superAdmin.residents.empty.headline')}
          helperText={t('superAdmin.residents.empty.helperText')}
          onAction={loadResidents}
        />
      ) : (
        <ResponsiveDataView
          ariaLabel={t('superAdmin.residents.title')}
          columns={columns}
          desktopTableMinWidth={1100}
          getRowId={(resident) => `${resident.residentId ?? resident.userId}-${resident.role}-${resident.blockName ?? 'platform'}`}
          rows={residents}
        />
      )}
    </Box>
  )
}

export default SuperAdminResidents
