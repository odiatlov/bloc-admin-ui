import React from 'react'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import { useTranslation } from 'react-i18next'
import { formatCurrency, getBlockLabel, useResidentPortal } from '../../../hooks/useApartmentData'

const ResidentDashboard: React.FC = () => {
  const { t } = useTranslation()
  const { apartmentsByBlock, currentBalance, lastPayment, resident, residentReadings } = useResidentPortal()
  const lastIndex = residentReadings.length ? residentReadings[0] : null
  const announcements = [
    { id: 'A1', date: '2026-05-01', textKey: 'dashboard.resident.announcements.elevator' },
    { id: 'A2', date: '2026-04-20', textKey: 'dashboard.resident.announcements.water' },
  ]

  return (
    <section className="dashboard">
      <Typography variant="h4" gutterBottom>
        {t('dashboard.resident.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {resident.name}
      </Typography>

      <Box sx={{ display: 'grid', gap: 2, mt: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' } }}>
        <Card>
          <CardContent>
            <Typography variant="h6">{t('dashboard.resident.currentDue')}</Typography>
            <Typography variant="h3" sx={{ mt: 1, mb: 2 }}>
              {formatCurrency(currentBalance)}
            </Typography>
            <Button variant="contained" color="primary">
              {t('dashboard.resident.pay')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6">{t('dashboard.resident.lastSubmittedIndex')}</Typography>
            {lastIndex ? (
              <Box sx={{ mt: 1 }}>
                <Typography>{t('dashboard.resident.indexValue', { value: lastIndex.currentValue })}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {lastIndex.month} - {t(`consumption.waterType.${lastIndex.waterType}`)}
                </Typography>
              </Box>
            ) : (
              <Typography color="text.secondary">{t('dashboard.resident.noIndex')}</Typography>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6">{t('dashboard.resident.recentAnnouncements')}</Typography>
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
          </CardContent>
        </Card>

        <Card sx={{ gridColumn: { xs: 'auto', lg: 'span 3' } }}>
          <CardContent>
            <Typography variant="h6">{t('dashboard.resident.myApartments')}</Typography>
            <Box sx={{ display: 'grid', gap: 1.25, mt: 1.5 }}>
              {Object.entries(apartmentsByBlock).map(([blockId, apartments]) => {
                const activeAdmin = apartments[0]?.activeAdmin
                return (
                  <Box key={blockId} sx={{ display: 'grid', gap: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Typography sx={{ fontWeight: 700 }}>{t('common.blockValue', { block: getBlockLabel(blockId) })}</Typography>
                      {activeAdmin && <Chip size="small" label={t('dashboard.resident.adminContact', { admin: activeAdmin.name, phone: activeAdmin.phone })} />}
                    </Box>
                    <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                      {apartments.map((apartment) => (
                        <Box key={apartment.id} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                          <Typography sx={{ fontWeight: 700 }}>Apt {apartment.number} - {apartment.familyName}</Typography>
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
          </CardContent>
        </Card>
      </Box>
    </section>
  )
}

export default ResidentDashboard
