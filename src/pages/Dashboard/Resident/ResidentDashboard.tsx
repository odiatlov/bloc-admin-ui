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

type Bill = {
  id: string
  dueDate: string
  amount: number
  status: 'paid' | 'unpaid'
}

type Consumption = {
  id: string
  date: string
  index: number
}

const ResidentDashboard: React.FC = () => {
  const { t } = useTranslation()

  // Mock data
  const bills: Bill[] = [
    { id: 'B-1001', dueDate: '2026-05-10', amount: 125.5, status: 'unpaid' },
    { id: 'B-1000', dueDate: '2026-04-10', amount: 98.25, status: 'paid' },
  ]

  const consumption: Consumption[] = [
    { id: 'C-202604', date: '2026-04-30', index: 324 },
    { id: 'C-202603', date: '2026-03-31', index: 310 },
  ]

  const announcements = [
    { id: 'A1', date: '2026-05-01', text: 'Elevator maintenance scheduled for May 12.' },
    { id: 'A2', date: '2026-04-20', text: 'Water shutoff for building B on April 22.' },
  ]

  const amountDue = bills.filter((b) => b.status === 'unpaid').reduce((s, b) => s + b.amount, 0)

  const lastIndex = consumption.length ? consumption[0] : null

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
                {amountDue.toLocaleString(undefined, { style: 'currency', currency: 'EUR' })}
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
                  <Typography>{t('dashboard.resident.indexValue', { value: lastIndex.index })}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(lastIndex.date).toLocaleDateString()}
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
              <List>
                {announcements.length ? (
                  announcements.map((a) => (
                    <React.Fragment key={a.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemText primary={a.text} secondary={new Date(a.date).toLocaleDateString()} />
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

