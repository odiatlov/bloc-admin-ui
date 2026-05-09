import React from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

const Card: React.FC<{ title: string; value: React.ReactNode }> = ({ title, value }) => (
  <Paper elevation={1} style={{ padding: 16, flex: 1, minWidth: 140 }}>
    <Typography variant="subtitle2" color="textSecondary">
      {title}
    </Typography>
    <Typography variant="h6">{value}</Typography>
  </Paper>
)

const OverviewCards: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
      <Card title={t('dashboard.admin.overview.residents')} value={124} />
      <Card title={t('dashboard.admin.overview.apartments')} value={87} />
      <Card title={t('dashboard.admin.overview.blocks')} value={3} />
    </Box>
  )
}

export default OverviewCards
