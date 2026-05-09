import React from 'react'
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
  return (
    <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
      <Card title="Residents" value={124} />
      <Card title="Apartments" value={87} />
      <Card title="Blocks" value={3} />
    </Box>
  )
}

export default OverviewCards
