import { useContext, useState } from 'react'
import Box from '@mui/material/Box'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useTranslation } from 'react-i18next'
import { RoleContext } from '../../../../contexts/RoleContext'
import EmptyState from '../../../../components/shared/EmptyState'
import PageHeader from '../../../../components/shared/PageHeader'
import PagedResponsiveDataView from '../../../../components/shared/PagedResponsiveDataView'
import type { DataColumn } from '../../../../components/shared/ResponsiveDataView'
import MeterHistoryDrawer from '../../../../components/water/MeterHistoryDrawer'
import { apiGet } from '../../../../services/apiClient'
import type { ApartmentMeterHistory, ResidentWaterMeter } from '../../../../types/waterReadings'

const loadHistory = (apartmentId: string, signal: AbortSignal) =>
  apiGet<ApartmentMeterHistory>(`/resident-water/apartments/${encodeURIComponent(apartmentId)}/meters`, signal)

function ResidentMeterList() {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<ResidentWaterMeter | null>(null)
  const columns: DataColumn<ResidentWaterMeter>[] = [
    { key: 'zone', label: t('residentMeters.zone'), cardRole: 'primary',
      render: (meter) => meter.isActive ? meter.name : `${meter.name} (${t('meterHistory.inactive')})` },
    { key: 'utility', label: t('consumption.columns.waterType'),
      render: (meter) => t(meter.utilityType === 'HotWater' ? 'consumption.waterType.hot' : 'consumption.waterType.cold') },
    { key: 'apartment', label: t('consumption.columns.apartment'), render: (meter) => meter.apartmentNumber },
    { key: 'block', label: t('persons.filters.block'), render: (meter) => meter.blockName },
    { key: 'staircase', label: t('blocks.columns.staircase'), render: (meter) => meter.staircaseName ?? '—' },
    { key: 'actions', label: t('residentMeters.viewDetails'), actions: (meter) => [
      { id: 'details', label: t('residentMeters.viewDetails'), icon: <VisibilityIcon />, onClick: () => setSelected(meter) },
    ] },
  ]

  return <Box>
    <PageHeader title={t('sidebar.meters')} description={t('residentMeters.description')} />
    <PagedResponsiveDataView endpoint="/resident-water/meters/page" paginationId="ResidentMeters"
      rows={[]} columns={columns} getRowId={(meter) => meter.id} ariaLabel={t('sidebar.meters')}
      emptyState={<EmptyState headline={t('meterHistory.noMeters')} helperText={t('residentMeters.emptyHelper')} />} />
    <MeterHistoryDrawer apartmentId={selected?.apartmentId ?? null} initialMeterId={selected?.id}
      title={t('residentMeters.details')} loadHistory={loadHistory} onClose={() => setSelected(null)} />
  </Box>
}

export default function ResidentMeters() {
  const { account, token } = useContext(RoleContext)
  return <ResidentMeterList key={`${account.id}:${token}`} />
}
