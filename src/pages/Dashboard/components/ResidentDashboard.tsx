import React from 'react'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import PaymentIcon from '@mui/icons-material/Payment'
import OpacityIcon from '@mui/icons-material/Opacity'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatCurrency, formatMonth, formatNumber, getBlockLabel, useResidentPortal, type WaterReadingRow } from '../../../hooks/useApartmentData'
import { ActionBar, ContentCard, DashboardHeader, DashboardPage, StatCard, StatGrid } from './DashboardSystem'

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
    <DashboardPage>
      <DashboardHeader title={t('dashboard.resident.title')} context={resident.name} />

      <ActionBar title={t('dashboard.resident.quickActions')}>
        {residentInvoices.length > 0 && (
          <Button startIcon={<PaymentIcon />} variant="contained" onClick={() => navigate('/admin/finance')}>
            {t('dashboard.resident.pay')}
          </Button>
        )}
        <Button startIcon={<OpacityIcon />} variant="outlined" onClick={() => navigate('/admin/consumption')}>
          {t('consumption.actions.submitIndex')}
        </Button>
      </ActionBar>

      <StatGrid columns={{ xs: 'repeat(2, minmax(0, 1fr))' }}>
        <StatCard
          label={t('dashboard.resident.currentDue')}
          value={formatCurrency(currentBalance)}
          secondary={t('dashboard.resident.currentDueSubtitle')}
        />

        <StatCard label={t('dashboard.resident.lastSubmittedIndex')}>
          {lastIndex ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) minmax(180px, 0.9fr)' },
                gap: 2,
                alignItems: 'start',
              }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '1.875rem' }, fontWeight: 700, lineHeight: 1.12 }}>
                  {formatNumber(lastIndex.usageValue)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('consumption.columns.totalUsage')} - {formatMonth(lastIndex.month)}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'grid',
                  gap: 0.5,
                  pl: { sm: 2 },
                  pt: { xs: 1, sm: 0 },
                  borderLeft: { sm: '1px solid' },
                  borderTop: { xs: '1px solid', sm: 'none' },
                  borderColor: 'divider',
                }}
              >
                {[
                  { label: t('dashboard.resident.coldWaterTotal'), value: renderMeterTotal(lastIndex.meters.cold) },
                  { label: t('dashboard.resident.hotWaterTotal'), value: renderMeterTotal(lastIndex.meters.hot) },
                ].map((item) => (
                  <Typography key={item.label} variant="body2" color="text.secondary">
                    {item.label}: <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{item.value}</Box>
                  </Typography>
                ))}
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary">{t('dashboard.resident.noIndex')}</Typography>
          )}
        </StatCard>
      </StatGrid>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
          alignItems: 'stretch',
        }}
      >
        <ContentCard title={t('dashboard.resident.myApartments')}>
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
                        sx={{
                          maxWidth: '100%',
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(129, 140, 248, 0.18)' : 'rgba(79, 70, 229, 0.08)',
                          border: '1px solid',
                          borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(129, 140, 248, 0.32)' : 'rgba(79, 70, 229, 0.18)',
                          color: 'text.primary',
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          },
                        }}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'grid', gap: 1 }}>
                    {apartments.map((apartment) => (
                      <Box key={apartment.id} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography sx={{ fontWeight: 500 }}>Apt {apartment.number} - {apartment.familyName}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                          {t(`residents.ownership.${apartment.residentApartment?.ownershipType ?? 'owner'}`)}
                          {apartment.residentApartment?.isPrimaryResidence ? ` - ${t('dashboard.resident.primaryResidence')}` : ''}
                          {' | '}
                          {t('dashboard.resident.surfaceSummary', { usable: formatNumber(apartment.usableSurface), total: formatNumber(apartment.totalSurface) })}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )
            })}
          </Box>
        </ContentCard>

        <ContentCard title={t('dashboard.resident.recentAnnouncements')}>
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
        </ContentCard>
      </Box>
    </DashboardPage>
  )
}

export default ResidentDashboard
