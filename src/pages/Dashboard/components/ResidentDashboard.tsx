import React from 'react'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
// use Box-based CSS grid for responsive layout to avoid Grid typing issues
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import { useTranslation } from 'react-i18next'
import { formatCurrency, useResidentPortal } from '../../../hooks/useApartmentData'

const ResidentDashboard: React.FC = () => {
  const { t } = useTranslation()
  const { currentBalance, lastPayment, residentReadings } = useResidentPortal()
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

      <Box sx={{ display: 'grid', gap: 2, mt: 1, gridTemplateColumns: { xs: '1fr', md: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' } }}>
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
                    {lastIndex.month}
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
                  announcements.map((a) => (
                    <React.Fragment key={a.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemText primary={t(a.textKey)} secondary={new Date(a.date).toLocaleDateString()} />
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
      </Box>
    </section>
  )
}

export default ResidentDashboard

