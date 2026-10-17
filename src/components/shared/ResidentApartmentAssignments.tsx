import Box from '@mui/material/Box'
import AssociationBadge from './AssociationBadge'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type { ResidentApartmentSummary } from '../../types/management'

type Props = { apartments: ResidentApartmentSummary[] }

const formatApartmentAssignment = (apartment: Pick<ResidentApartmentSummary, 'blockName' | 'staircaseName' | 'apartmentNumber'>) =>
  `${apartment.blockName}/${apartment.staircaseName || '—'}/${apartment.apartmentNumber}`

export default function ResidentApartmentAssignments({ apartments }: Props) {
  const { t } = useTranslation()
  if (apartments.length === 0) return <Typography variant="body2" color="text.secondary">{t('residents.assignments.empty')}</Typography>
  return <Box component="ul" sx={{ m: 0, pl: 0, listStyle: 'none', display: 'grid', gap: 0.5 }}>
    {apartments.map(apartment => <Box component="li" key={apartment.apartmentId} sx={{ minWidth: 0 }}>
      <AssociationBadge label={formatApartmentAssignment(apartment)} />
    </Box>)}
  </Box>
}
