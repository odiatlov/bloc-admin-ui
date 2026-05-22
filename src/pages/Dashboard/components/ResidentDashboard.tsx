import React from 'react'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import PaymentIcon from '@mui/icons-material/Payment'
import OpacityIcon from '@mui/icons-material/Opacity'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatCurrency, formatMonth, formatNumber, getBlockLabel, useResidentPortal, type WaterReadingRow } from '../../../hooks/useApartmentData'

const ResidentDashboard: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { apartmentsByBlock, currentBalance, lastPayment, resident, residentReadings } = useResidentPortal()
  const lastIndex = residentReadings.length ? residentReadings[0] : null
  const renderMeter = (meter: WaterReadingRow['meters']['cold']) =>
    meter ? `${formatNumber(meter.currentValue)} (${formatNumber(meter.usageValue)})` : t('common.notAvailable')
  const announcements = [
    { id: 'A1', date: '2026-05-01', textKey: 'dashboard.resident.announcements.elevator' },
    { id: 'A2', date: '2026-04-20', textKey: 'dashboard.resident.announcements.water' },
  ]

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          {t('dashboard.resident.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {resident.name}
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {t('dashboard.resident.quickActions')}
        </Typography>
        <Paper sx={{ p: 1.5, width: '100%', boxSizing: 'border-box', display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button startIcon={<PaymentIcon />} variant="contained" onClick={() => navigate('/admin/finance')}>
            {t('dashboard.resident.pay')}
          </Button>
          <Button startIcon={<OpacityIcon />} variant="outlined" onClick={() => navigate('/admin/consumption')}>
            {t('consumption.actions.submitIndex')}
          </Button>
        </Paper>
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gridAutoRows: '1fr' }}>
        <Paper sx={{ p: 2, height: '100%', display: 'grid', alignContent: 'start', gap: 1.25 }}>
          <Typography variant="body2" color="text.secondary">
            {t('dashboard.resident.currentDue')}
          </Typography>
          <Typography variant="h4">{formatCurrency(currentBalance)}</Typography>
        </Paper>

        <Paper sx={{ p: 2, height: '100%', display: 'grid', alignContent: 'start', gap: 1.25 }}>
          <Typography variant="body2" color="text.secondary">
            {t('dashboard.resident.lastSubmittedIndex')}
          </Typography>
            {lastIndex ? (
              <Box>
                <Typography>{t('dashboard.resident.indexValue', { value: formatNumber(lastIndex.usageValue) })}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatMonth(lastIndex.month)} - {t('consumption.waterType.cold')}: {renderMeter(lastIndex.meters.cold)} - {t('consumption.waterType.hot')}: {renderMeter(lastIndex.meters.hot)}
                </Typography>
              </Box>
            ) : (
              <Typography color="text.secondary">{t('dashboard.resident.noIndex')}</Typography>
            )}
        </Paper>

        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="body2" color="text.secondary">
            {t('dashboard.resident.recentAnnouncements')}
          </Typography>
            {lastPayment && (
              <Typography variant="body2" color="text.secondary">
                {t('dashboard.resident.lastPayment', { amount: formatCurrency(lastPayment.amount) })}
              </Typography>
            )}
            <List>
              {announcements.length ? (
                announcements.map((item) => (
                  <React.Fragment key={item.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemText primary={t(item.textKey)} secondary={new Date(item.date).toLocaleDateString()} />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary={t('dashboard.resident.noAnnouncements')} />
                </ListItem>
              )}
            </List>
        </Paper>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">{t('dashboard.resident.myApartments')}</Typography>
            <Box sx={{ display: 'grid', gap: 1.25, mt: 1.5 }}>
              {Object.entries(apartmentsByBlock).map(([blockId, apartments]) => {
                const activeAdmin = apartments[0]?.activeAdmin
                return (
                  <Box key={blockId} sx={{ display: 'grid', gap: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Typography>{t('common.blockValue', { block: getBlockLabel(blockId) })}</Typography>
                      {activeAdmin && <Chip size="small" label={t('dashboard.resident.adminContact', { admin: activeAdmin.name, phone: activeAdmin.phone })} />}
                    </Box>
                    <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                      {apartments.map((apartment) => (
                        <Box key={apartment.id} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                          <Typography>Apt {apartment.number} - {apartment.familyName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t(`residents.ownership.${apartment.residentApartment?.ownershipType ?? 'owner'}`)}
                            {apartment.residentApartment?.isPrimaryResidence ? ` - ${t('dashboard.resident.primaryResidence')}` : ''}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {apartment.usableSurface} sqm utili - {apartment.totalSurface} sqm total
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )
              })}
            </Box>
      </Paper>
    </Box>
  )
}

export default ResidentDashboard
