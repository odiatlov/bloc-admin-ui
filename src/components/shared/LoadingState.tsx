import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

type Props = {
  label: string
  variant?: 'page' | 'section' | 'compact'
  showLabel?: boolean
}

const layout = {
  page: { flexGrow: 1, minHeight: 128 },
  section: { minHeight: 128 },
  compact: { py: 1 },
}

export default function LoadingState({ label, variant = 'section', showLabel = false }: Props) {
  return <Box role="status" sx={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 1.5, textAlign: 'center', ...layout[variant],
  }}>
    <CircularProgress size={variant === 'compact' ? 24 : 32} aria-label={label} />
    {showLabel && <Typography color="text.secondary">{label}</Typography>}
  </Box>
}
