import type React from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/en'
import 'dayjs/locale/ro'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { useTranslation } from 'react-i18next'

type AppDatePickerProps = {
  label: string
  value: string
  onChange?: (value: string) => void
}

const AppDatePicker: React.FC<AppDatePickerProps> = ({ label, onChange, value }) => {
  const { i18n } = useTranslation()
  const adapterLocale = i18n.language.startsWith('ro') ? 'ro' : 'en'

  const handleChange = (nextValue: Dayjs | null) => {
    if (nextValue?.isValid()) onChange?.(nextValue.format('YYYY-MM-DD'))
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={adapterLocale}>
      <DatePicker
        label={label}
        value={dayjs(value)}
        onChange={handleChange}
        slotProps={{
          textField: {
            fullWidth: true,
            size: 'small',
          },
        }}
      />
    </LocalizationProvider>
  )
}

export default AppDatePicker
