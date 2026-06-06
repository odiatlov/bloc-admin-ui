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
  const { apartmentsByBlock, currentBalance, resident, residentInvoices, residentReadings } = useResidentPortal()
  const lastIndex = residentReadings.length ? residentReadings[0] : null
  const renderMeterTotal = (meter: WaterReadingRow['meters']['cold']) =>
    meter ? formatNumber(meter.usageValue) : t('common.notAvailable')
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

      <Paper sx={{ p: 1.5, width: '100%', boxSizing: 'border-box', display: 'grid', gap: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {t('dashboard.resident.quickActions')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {residentInvoices.length > 0 && (
            <Button startIcon={<PaymentIcon />} variant="contained" onClick={() => navigate('/admin/finance')}>
              {t('dashboard.resident.pay')}
            </Button>
          )}
          <Button startIcon={<OpacityIcon />} variant="outlined" onClick={() => navigate('/admin/consumption')}>
            {t('consumption.actions.submitIndex')}
          </Button>
        </Box>
      </Paper>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gridTemplateRows: { md: 'repeat(2, minmax(0, 1fr))' },
          alignItems: 'stretch',
        }}
      >
        <Paper sx={{ p: 2, display: 'grid', alignContent: 'start', gap: 0.75, height: '100%', boxSizing: 'border-box' }}>
          <Typography variant="body2" color="text.secondary">
            {t('dashboard.resident.currentDue')}
          </Typography>
          <Typography variant="h4" sx={{ lineHeight: 1.15 }}>{formatCurrency(currentBalance)}</Typography>
          <Typography variant="caption" color="text.secondary">
            {t('dashboard.resident.currentDueSubtitle')}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, display: 'grid', alignContent: 'start', gap: 1.25, height: '100%', boxSizing: 'border-box' }}>
          <Typography variant="body2" color="text.secondary">
            {t('dashboard.resident.lastSubmittedIndex')}
          </Typography>
          {lastIndex ? (
            <Box sx={{ display: 'grid', gap: 1 }}>
              <Box>
                <Typography variant="h5" sx={{ lineHeight: 1.2 }}>{formatNumber(lastIndex.usageValue)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('consumption.columns.totalUsage')} - {formatMonth(lastIndex.month)}
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gap: 0.75 }}>
                {[
                  { label: t('dashboard.resident.coldWaterTotal'), value: renderMeterTotal(lastIndex.meters.cold) },
                  { label: t('dashboard.resident.hotWaterTotal'), value: renderMeterTotal(lastIndex.meters.hot) },
                ].map((item) => (
                  <Box
                    key={item.label}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 2,
                      alignItems: 'center',
                      py: 0.75,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.value}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary">{t('dashboard.resident.noIndex')}</Typography>
          )}
        </Paper>

        <Paper sx={{ p: 2, height: '100%', boxSizing: 'border-box' }}>
          <Typography variant="h6">{t('dashboard.resident.myApartments')}</Typography>
          <Box sx={{ display: 'grid', gap: 1.25, mt: 1.5 }}>
            {Object.entries(apartmentsByBlock).map(([blockId, apartments]) => {
              const activeAdmin = apartments[0]?.activeAdmin
              return (
                <Box key={blockId} sx={{ display: 'grid', gap: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography>{t('common.blockValue', { block: getBlockLabel(blockId) })}</Typography>
                    {activeAdmin && (
                      <Chip
                        size="small"
                        label={t('dashboard.resident.adminContact', { admin: activeAdmin.name, phone: activeAdmin.phone })}
                        sx={{ bgcolor: 'rgba(148, 163, 184, 0.1)', color: 'text.secondary', opacity: 0.82 }}
                      />
                    )}
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
                          {t('dashboard.resident.surfaceSummary', { usable: formatNumber(apartment.usableSurface), total: formatNumber(apartment.totalSurface) })}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )
            })}
          </Box>
        </Paper>

        <Paper sx={{ p: 2, height: '100%', boxSizing: 'border-box' }}>
          <Typography variant="body2" color="text.secondary">
            {t('dashboard.resident.recentAnnouncements')}
          </Typography>
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
    </Box>
  )
}

export default ResidentDashboard
