import React from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import PeopleIcon from '@mui/icons-material/People'
import HomeIcon from '@mui/icons-material/Home'
import ApartmentIcon from '@mui/icons-material/Apartment'
import { useTranslation } from 'react-i18next'

const Card = ({ icon, title, value }: any) => (
  <Paper
    sx={{
      p: 2,
      flex: 1,
      minWidth: 160,
      transition: '0.2s',
      '&:hover': { transform: 'translateY(-2px)' }
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {icon}
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
    </Box>

    <Typography variant="h6" sx={{ mt: 1 }}>
      {value}
    </Typography>
  </Paper>
)

const OverviewCards: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <Card icon={<PeopleIcon />} title={t('dashboard.admin.overview.residents')} value={124} />
      <Card icon={<HomeIcon />} title={t('dashboard.admin.overview.apartments')} value={87} />
      <Card icon={<ApartmentIcon />} title={t('dashboard.admin.overview.blocks')} value={3} />
    </Box>
  )
}

export default OverviewCards