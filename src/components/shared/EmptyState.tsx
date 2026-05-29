import React from 'react'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import { Link as RouterLink } from 'react-router-dom'

type EmptyStateProps = {
  actionLabel: string
  actionTo?: string
  headline: string
  helperText: string
  icon?: React.ReactNode
  onAction?: () => void
}

const EmptyState: React.FC<EmptyStateProps> = ({ actionLabel, actionTo, headline, helperText, icon, onAction }) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        alignItems: 'center',
        display: 'grid',
        gap: 1.5,
        justifyItems: 'center',
        px: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 5 },
        textAlign: 'center',
      }}
    >
      <Typography
        aria-hidden
        component="div"
        color="text.secondary"
        sx={{
          alignItems: 'center',
          bgcolor: 'action.hover',
          borderRadius: '50%',
          display: 'inline-flex',
          height: 48,
          justifyContent: 'center',
          width: 48,
        }}
      >
        {icon ?? <InboxOutlinedIcon color="primary" />}
      </Typography>
      <Typography variant="h6">{headline}</Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 460 }}>
        {helperText}
      </Typography>
      {actionTo ? (
        <Button variant="contained" component={RouterLink} to={actionTo}>
          {actionLabel}
        </Button>
      ) : (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Paper>
  )
}

export default EmptyState
