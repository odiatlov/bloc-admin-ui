import { useContext, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useTranslation } from 'react-i18next'
import { RoleContext } from '../../../../contexts/RoleContext'
import PageHeader from '../../../../components/shared/PageHeader'
import FilterBar from '../../../../components/shared/FilterBar'
import AppDatePicker from '../../../../components/shared/AppDatePicker'
import EmptyState from '../../../../components/shared/EmptyState'
import LoadErrorState from '../../../../components/shared/LoadErrorState'
import ResponsiveDataView from '../../../../components/shared/ResponsiveDataView'
import { useConsumptionColumns } from '../../../../components/water/useConsumptionColumns'
import { useSuperAdminConsumption } from '../../hooks/useSuperAdminConsumption'
import MeterHistoryDrawer from './components/MeterHistoryDrawer'

const ConsumptionView = () => {
  const { t } = useTranslation()
  const water = useSuperAdminConsumption()
  const { columns } = useConsumptionColumns(water.period)
  const [apartmentId, setApartmentId] = useState<string | null>(null)
  columns.push({
    key: 'meters', label: t('superAdmin.water.viewMeters'), cardRole: 'actions',
    render: (row) => row.hasMeters ? <Button size="small" startIcon={<VisibilityIcon />} onClick={() => setApartmentId(row.id)}>
      {t('superAdmin.water.viewMeters')}
    </Button> : null,
  })
  const disabled = water.loading || !!water.error
  return <Box sx={{ display: 'grid', gap: 2 }}>
    <PageHeader title={t('sidebar.consumption')} description={t('superAdmin.water.description')} />
    <FilterBar>
      <TextField select size="small" label={t('superAdmin.water.admin')} value={water.admin} disabled={disabled} onChange={(event) => water.setAdmin(event.target.value)}>
        <MenuItem value="all">{t('common.all')}</MenuItem>
        <MenuItem value="unassigned">{t('superAdmin.water.unassigned')}</MenuItem>
        {water.administrators.map((admin) => <MenuItem key={admin.id} value={admin.id}>{admin.name}</MenuItem>)}
      </TextField>
      <TextField select size="small" label={t('residents.filters.block')} value={water.block} disabled={disabled} onChange={(event) => water.setBlock(event.target.value)}>
        <MenuItem value="all">{t('common.all')}</MenuItem>
        {water.blocks.map((block) => <MenuItem key={block.id} value={block.id}>{t('common.blockValue', { block: block.name })}</MenuItem>)}
      </TextField>
      <AppDatePicker monthOnly confirmOnAccept label={t('finance.columns.month')} value={water.period} disabled={disabled || water.blocks.length === 0}
        minDate={`${water.minimumPeriod ?? water.period}-01`} maxDate="2100-12-31" onChange={water.setPeriod} />
    </FilterBar>
    {water.loading ? <Box role="status" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><CircularProgress size={24} />{t('consumption.loading')}</Box>
      : water.error ? <LoadErrorState helperText={t('consumption.errors.loadFailed')} onRetry={water.refresh} />
        : water.rows.length === 0 ? <EmptyState headline={t('consumption.report.empty')} helperText={t('consumption.report.emptyHelper')} actionLabel={t('common.retry')} onAction={water.refresh} />
          : <ResponsiveDataView rows={water.rows} columns={columns} getRowId={(row) => row.id} ariaLabel={t('consumption.sections.readings')} />}
    {apartmentId && <MeterHistoryDrawer key={apartmentId} apartmentId={apartmentId} onClose={() => setApartmentId(null)} />}
  </Box>
}

const SuperAdminConsumption = () => {
  const { account, token, accountsLoading, accountsError, refreshAccounts } = useContext(RoleContext)
  const { t } = useTranslation()
  if (accountsLoading) return <CircularProgress aria-label={t('consumption.loading')} />
  if (accountsError) return <LoadErrorState onRetry={refreshAccounts} />
  return <ConsumptionView key={`${account.id}:${token}`} />
}

export default SuperAdminConsumption
