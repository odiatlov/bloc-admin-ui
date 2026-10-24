import { Box, CircularProgress, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { apartmentConfigurationStatus } from '../../domain/apartmentConfiguration'
import { translateApartmentSetupStatus } from '../../domain/displayLabels'
import StatusChip from '../shared/StatusChip'

export default function ApartmentConfigurationBadge({ usableSqm, hasConsumptionZone = false, loading = false, unavailable = false, zonesAfterCreate = false }: {
  usableSqm: string | number | null; hasConsumptionZone?: boolean; loading?: boolean; unavailable?: boolean; zonesAfterCreate?: boolean
}) {
  const { t } = useTranslation()
  const status = apartmentConfigurationStatus(usableSqm, hasConsumptionZone)
  return <Box aria-live="polite" sx={{ display: 'grid', gap: 0.5, gridColumn: '1 / -1' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
      <Typography variant="body2">{t('apartments.setup.configurationStatus')}:</Typography>
      {loading ? <CircularProgress size={16} aria-label={t('apartments.waterIndex.loading')} />
        : unavailable ? <Typography variant="body2" color="text.secondary">{t('apartments.setup.configurationUnavailable')}</Typography>
          : <StatusChip status={status} label={translateApartmentSetupStatus(t, status)} />}
    </Box>
    {!loading && !unavailable && <Typography variant="caption" color="text.secondary">
      {t(status === 'configured' ? 'apartments.setup.configurationReady'
        : Number.isFinite(Number(usableSqm)) && Number(usableSqm) > 0 ? 'apartments.setup.configurationNeedsZone'
          : hasConsumptionZone ? 'apartments.setup.configurationNeedsSurface' : 'apartments.setup.configurationRequirements')}
    </Typography>}
    {zonesAfterCreate && <Typography variant="caption" color="text.secondary">{t('apartments.setup.configurationZonesAfterCreate')}</Typography>}
  </Box>
}
