import React from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import PeopleIcon from '@mui/icons-material/People'
import HomeIcon from '@mui/icons-material/Home'
import ApartmentIcon from '@mui/icons-material/Apartment'
import { useTranslation } from 'react-i18next'
import { buildingBlocks, residents } from '../../../mocks/apartmentData'

type CardProps = {
  icon: React.ReactNode
  title: string
  value: number
}

const Card: React.FC<CardProps> = ({ icon, title, value }) => (
  <Paper
    sx={{
      p: 2,
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

const AdminOverviewCards: React.FC = () => {
  const { t } = useTranslation()
  const apartments = new Set(residents.map((resident) => `${resident.apartment.block}-${resident.apartment.number}`)).size

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          xl: 'repeat(3, minmax(0, 1fr))',
        },
        gap: 2,
      }}
    >
      <Card icon={<PeopleIcon />} title={t('dashboard.admin.overview.residents')} value={residents.length} />
      <Card icon={<HomeIcon />} title={t('dashboard.admin.overview.apartments')} value={apartments} />
      <Card icon={<ApartmentIcon />} title={t('dashboard.admin.overview.blocks')} value={buildingBlocks.length} />
    </Box>
  )
}

export default AdminOverviewCards
