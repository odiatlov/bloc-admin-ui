import { alpha, type CSSObject, type Theme } from '@mui/material/styles'

const numberSpinnerImage = (color: string) => `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" viewBox="0 0 16 20"><path fill="${color}" d="M8 2 12 7H4ZM4 13H12L8 18Z"/></svg>`,
)}")`

// CssBaseline also reaches menus, dialogs and drawers rendered through portals.
export const nativeControlStyles = (theme: Theme): CSSObject => ({
  ':root': {
    '--app-scrollbar-thumb': alpha(theme.palette.text.primary, 0.45),
    '--app-scrollbar-thumb-hover': theme.palette.text.secondary,
    '--app-scrollbar-track': theme.palette.background.default,
  },
  // Leave high-contrast native controls to the browser/system palette.
  '@media (forced-colors: none)': {
    ':root': {
      // This property is inherited, including by nested scrolling containers.
      scrollbarColor: 'var(--app-scrollbar-thumb) var(--app-scrollbar-track)',
    },
    // Standard scrollbar colors take precedence over WebKit pseudo-elements.
    '@supports not (scrollbar-color: auto)': {
      '::-webkit-scrollbar': {
        width: 12,
        height: 12,
      },
      '::-webkit-scrollbar-track, ::-webkit-scrollbar-corner': {
        backgroundColor: 'var(--app-scrollbar-track)',
      },
      '::-webkit-scrollbar-thumb': {
        backgroundColor: 'var(--app-scrollbar-thumb)',
        border: '3px solid var(--app-scrollbar-track)',
        borderRadius: 12,
      },
      '::-webkit-scrollbar-thumb:hover': {
        backgroundColor: 'var(--app-scrollbar-thumb-hover)',
      },
    },
    // Repaint the native hit target; min/max/step and input events stay native.
    // Do not introduce desktop spin controls on touch-only devices.
    '@media (hover: hover) and (pointer: fine)': {
      'input[type="number"]::-webkit-inner-spin-button': {
        WebkitAppearance: 'none',
        appearance: 'none',
        alignSelf: 'center',
        width: 16,
        height: 20,
        margin: 0,
        marginInlineStart: 4,
        border: 0,
        boxShadow: 'none',
        backgroundColor: 'transparent',
        backgroundImage: numberSpinnerImage(theme.palette.text.secondary),
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '16px 20px',
        // Keep the browser's hover/focus visibility and disabled/read-only rules.
      },
    },
  },
})
