import { createTheme } from '@mui/material/styles'

const createThemeConfig = (mode: 'light' | 'dark' = 'dark') =>
  createTheme({
    palette: {
      mode,
      primary: {
        // Indigo-400 for Dark Mode (vibrant) and Indigo-600 for Light Mode (contrastant)
        main: mode === 'dark' ? '#818CF8' : '#4F46E5',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#06b6d4',
        contrastText: '#ffffff',
      },
      background: mode === 'dark' ? { default: '#0b1220', paper: '#0f1724' } : { default: '#f0f2f5', paper: '#ffffff' },
      text: mode === 'dark' ? { primary: '#e6eef6', secondary: 'rgba(230,238,246,0.7)' } : { primary: '#0b1220', secondary: 'rgba(11,18,32,0.7)' }
    },
    typography: {
      fontFamily: ['Inter', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(','),
      h6: {
        fontWeight: 700,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: (theme) => ({
          a: { color: 'inherit', textDecoration: 'none' },
          body: { backgroundColor: theme.palette.background.default },
          '#root': { minHeight: '100vh', backgroundColor: theme.palette.background.default },
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
        }),
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? 'transparent' : 'rgba(255,255,255,0.74)',
            boxShadow: 'none',
            backdropFilter: 'blur(10px)',
            borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(11,18,32,0.08)',
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
          root: ({ ownerState }) => ({
            textTransform: 'none',
            borderRadius: '6px',
            fontWeight: 500,

            // Styles for Contained variant (Contained Button)
            ...(ownerState.variant === 'contained' && ownerState.color === 'primary' && {
              backgroundColor: mode === 'dark' ? '#6366F1' : '#4F46E5',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: mode === 'dark' ? '#4F46E5' : '#4338CA',
              },
            }),

            // Styles for Outlined variant (Outlined Button)
            ...(ownerState.variant === 'outlined' && ownerState.color === 'primary' && {
              borderColor: mode === 'dark' ? '#818CF8' : '#4F46E5',
              color: mode === 'dark' ? '#818CF8' : '#4F46E5',
              backgroundColor: 'transparent',
              '&:hover': {
                borderColor: mode === 'dark' ? '#818CF8' : '#4338CA',
                backgroundColor: mode === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.05)',
              },
            }),
          }),
        },
      },
    }
  })

export default createThemeConfig
