import React from 'react'
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

type LoadErrorStateProps = {
  helperText?: string
  headline?: string
  isRetrying?: boolean
  onRetry: () => void
  inline?: boolean
}

const LoadErrorState: React.FC<LoadErrorStateProps> = ({
  helperText,
  headline,
  isRetrying = false,
  onRetry,
  inline = false,
}) => {
  const { t } = useTranslation()

  return (
    <Paper
      role="alert"
      variant={inline ? 'elevation' : 'outlined'}
      elevation={0}
      sx={{
        alignItems: 'center',
        display: 'grid',
        gap: 1.5,
        justifyItems: 'center',
        px: inline ? 0 : { xs: 2, sm: 3 },
        py: inline ? 1 : { xs: 4, sm: 5 },
        bgcolor: inline ? 'transparent' : undefined,
        textAlign: 'center',
      }}
    >
      <Typography
        aria-hidden
        component="div"
        color="error"
        sx={{
          alignItems: 'center',
          bgcolor: 'action.hover',
          borderRadius: '50%',
          display: inline ? 'none' : 'inline-flex',
          height: 48,
          justifyContent: 'center',
          width: 48,
        }}
      >
        <CloudOffOutlinedIcon color="error" />
      </Typography>
      <Typography variant={inline ? 'body2' : 'h6'}>
        {headline ?? t('loadErrorState.headline')}
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 460 }}>
        {helperText ?? t('loadErrorState.helperText')}
      </Typography>
      <Button disabled={isRetrying} variant={inline ? 'text' : 'contained'} onClick={onRetry}>
        {isRetrying ? t('loadErrorState.retrying') : t('loadErrorState.retry')}
      </Button>
    </Paper>
  )
}

export default LoadErrorState
