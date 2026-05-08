import type { Theme } from '@mui/material/styles'

const globalStyles = (theme: Theme) => ({
  a: { color: 'inherit', textDecoration: 'none' },
  body: { backgroundColor: theme.palette.background.default },
  '.aurora-logo-box': {
    width: 36,
    height: 36,
    backgroundColor: theme.palette.mode === 'dark' ? '#ffffff' : '#0b1220',
    borderRadius: theme.shape.borderRadius ?? 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.mode === 'dark' ? '#0b1220' : '#ffffff',
    fontWeight: 700,
    fontSize: 14,
  },
})

export default globalStyles
