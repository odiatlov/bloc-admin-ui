import React from 'react'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

const items = [
  { text: 'Invoice generated - Block A', time: '2h ago' },
  { text: 'Payment received - Apt 12', time: '4h ago' },
  { text: 'Water reading submitted - Apt 7', time: '1d ago' }
]

const ActivityFeed: React.FC = () => {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6">Recent Activity</Typography>

      <Box sx={{ mt: 1 }}>
        {items.map((i, idx) => (
          <Box key={idx} sx={{ mb: 1 }}>
            <Typography variant="body2">{i.text}</Typography>
            <Typography variant="caption" color="text.secondary">
              {i.time}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

export default ActivityFeed