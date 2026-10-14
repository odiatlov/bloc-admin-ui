import { useTranslation } from 'react-i18next'
import type { DataColumn } from '../shared/ResponsiveDataView'
import StatusChip from '../shared/StatusChip'
import { translateApartmentSetupStatus } from '../../domain/displayLabels'
import { formatSquareMeters } from '../../hooks/useApartmentData'
import type { ApartmentResponse } from '../../types/management'

export const useApartmentColumns = (): DataColumn<ApartmentResponse>[] => {
  const { t } = useTranslation()
  return [
    { key: 'number', label: t('apartments.setup.number'), cardRole: 'primary', render: (apartment) => t('residents.apartment.number', { number: apartment.number }) },
    { key: 'residentNames', label: t('apartments.setup.assignedResident'), cardRole: 'secondary', render: (apartment) => apartment.residentNames || t('apartments.setup.noOwner') },
    { key: 'residents', label: t('apartments.setup.householdMembers'), render: (apartment) => apartment.residentCount },
    { key: 'floor', label: t('blocks.columns.floor'), render: (apartment) => apartment.floor ?? '-' },
    { key: 'staircase', label: t('blocks.columns.staircase'), render: (apartment) => apartment.staircaseName || '-' },
    { key: 'usableSurface', label: t('blocks.columns.usableSurface'), render: (apartment) => apartment.usableSqm === null ? '-' : formatSquareMeters(apartment.usableSqm) },
    { key: 'setupStatus', label: t('apartments.setup.setupStatus'), cardRole: 'status', render: (apartment) => <StatusChip status={apartment.setupStatus} label={translateApartmentSetupStatus(t, apartment.setupStatus)} /> },
  ]
}
