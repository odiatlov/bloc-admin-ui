import { createTheme } from '@mui/material/styles'

const createAuroraTheme = (mode: 'light' | 'dark' = 'dark') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: '#8b5cf6',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#06b6d4',
        contrastText: '#ffffff',
      },
      background: mode === 'dark' ? { default: '#0b1220', paper: '#0f1724' } : { default: '#f7fbff', paper: '#ffffff' },
      text: mode === 'dark' ? { primary: '#e6eef6', secondary: 'rgba(230,238,246,0.7)' } : { primary: '#0b1220', secondary: 'rgba(11,18,32,0.7)' }
    },
    typography: {
      fontFamily: ['Inter', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(','),
      h6: {
        fontWeight: 700,
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? 'transparent' : '#fff',
            boxShadow: 'none',
            backdropFilter: 'blur(6px)',
            borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(11,18,32,0.04)',
            color: mode === 'dark' ? '#e6eef6' : '#0b1220'
          }
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'dark' ? '#0b1220' : '#ffffff',
            color: mode === 'dark' ? '#fff' : '#0b1220',
            borderRight: mode === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(11,18,32,0.06)'
          }
        }
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            paddingLeft: 16,
            paddingRight: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }
        }
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(11,18,32,0.06)'
          }
        }
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            color: 'inherit',
            '&.active': { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(11,18,32,0.04)' },
            '&:hover': { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(11,18,32,0.02)' },
          }
        }
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            color: 'inherit',
            minWidth: 40,
          }
        }
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            color: 'inherit'
          }
        }
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            color: 'inherit'
          },
          icon: {
            color: 'inherit'
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            color:'#e6eef6'
          }
        }
      }
    }
  })

export default createAuroraTheme
