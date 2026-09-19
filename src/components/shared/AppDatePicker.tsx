import type React from 'react'
import { useState } from 'react'
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
  monthOnly?: boolean
  disabled?: boolean
  minDate?: string
  maxDate?: string
  confirmOnAccept?: boolean
}

const AppDatePicker: React.FC<AppDatePickerProps> = ({ label, onChange, value, monthOnly = false, disabled, minDate, maxDate, confirmOnAccept = false }) => {
  const { i18n } = useTranslation()
  const [draft, setDraft] = useState<Dayjs | null | undefined>(undefined)
  const adapterLocale = i18n.language.startsWith('ro') ? 'ro' : 'en'

  const handleChange = (nextValue: Dayjs | null) => {
    if (!nextValue?.isValid()) return
    const unit = monthOnly ? 'month' : 'day'
    if (minDate && nextValue.isBefore(dayjs(minDate), unit)) return
    if (maxDate && nextValue.isAfter(dayjs(maxDate), unit)) return
    onChange?.(nextValue.format(monthOnly ? 'YYYY-MM' : 'YYYY-MM-DD'))
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={adapterLocale}>
      <DatePicker
        label={label}
        disabled={disabled}
        views={monthOnly ? ['year', 'month'] : undefined}
        openTo={monthOnly ? 'month' : undefined}
        minDate={minDate ? dayjs(minDate) : undefined}
        maxDate={maxDate ? dayjs(maxDate) : undefined}
        value={confirmOnAccept && draft !== undefined ? draft : dayjs(value)}
        onChange={confirmOnAccept ? setDraft : handleChange}
        onAccept={confirmOnAccept ? handleChange : undefined}
        onClose={confirmOnAccept ? () => setDraft(undefined) : undefined}
        closeOnSelect={confirmOnAccept ? false : undefined}
        slotProps={{
          actionBar: confirmOnAccept ? { actions: ['cancel', 'accept'] } : undefined,
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
