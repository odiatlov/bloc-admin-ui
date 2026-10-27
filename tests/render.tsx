import type { ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { createInstance } from 'i18next'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import en from '../src/i18n/locales/en.json'
import ro from '../src/i18n/locales/ro.json'
import createThemeConfig from '../src/theme/themeConfig'

type Options = Omit<RenderOptions, 'wrapper'> & {
  language?: 'en' | 'ro'
  mode?: 'light' | 'dark'
}

// Each render gets an isolated language instance, independent of app storage.
export function renderWithProviders(ui: ReactElement, { language = 'en', mode = 'light', ...options }: Options = {}) {
  const i18n = createInstance()
  void i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, ro: { translation: ro } },
    lng: language,
    fallbackLng: 'en',
    initAsync: false,
    interpolation: { escapeValue: false },
  })

  return render(ui, {
    ...options,
    wrapper: ({ children }) => (
      <ThemeProvider theme={createThemeConfig(mode)}>
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
      </ThemeProvider>
    ),
  })
}
