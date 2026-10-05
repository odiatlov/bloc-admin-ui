import type React from 'react'
import { forwardRef, useState } from 'react'
import IconButton, { type IconButtonProps } from '@mui/material/IconButton'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/en'
import 'dayjs/locale/ro'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { enUS, roRO } from '@mui/x-date-pickers/locales'
import { useTranslation } from 'react-i18next'
import IconButtonTooltip from './IconButtonTooltip'

type PickerIconButtonProps = IconButtonProps & {
  ownerState?: { isButtonHidden?: boolean; view?: string }
}

const PickerIconButton = forwardRef<HTMLButtonElement, PickerIconButtonProps>(
  function PickerIconButton({ ownerState, title, sx, ...props }, ref) {
    const label = props['aria-label'] ?? title
    const button = <IconButton {...props} ref={ref} sx={[
      {
        visibility: ownerState?.isButtonHidden ? 'hidden' : undefined,
        ...(ownerState?.view ? {
          mr: 'auto',
          '& .MuiPickersCalendarHeader-switchViewIcon': { transform: ownerState.view === 'year' ? 'rotate(180deg)' : 'rotate(0deg)' },
        } : {}),
      },
      ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
    ]} />
    return label && !ownerState?.isButtonHidden ? <IconButtonTooltip title={label}>{button}</IconButtonTooltip> : button
  },
)

type AppDatePickerProps = {
  label: string
  value: string
  onChange?: (value: string) => void
  monthOnly?: boolean
  disabled?: boolean
  minDate?: string
  maxDate?: string
  confirmOnAccept?: boolean
  availableMonths?: readonly string[]
}

const AppDatePicker: React.FC<AppDatePickerProps> = ({ label, onChange, value, monthOnly = false, disabled, minDate, maxDate, confirmOnAccept = false, availableMonths }) => {
  const { i18n } = useTranslation()
  const [draft, setDraft] = useState<Dayjs | null | undefined>(undefined)
  const adapterLocale = i18n.language.startsWith('ro') ? 'ro' : 'en'

  const handleChange = (nextValue: Dayjs | null) => {
    if (!nextValue?.isValid()) return
    if (availableMonths && !availableMonths.includes(nextValue.format('YYYY-MM'))) return
    const unit = monthOnly ? 'month' : 'day'
    if (minDate && nextValue.isBefore(dayjs(minDate), unit)) return
    if (maxDate && nextValue.isAfter(dayjs(maxDate), unit)) return
    onChange?.(nextValue.format(monthOnly ? 'YYYY-MM' : 'YYYY-MM-DD'))
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={adapterLocale}
      localeText={(adapterLocale === 'ro' ? roRO : enUS).components.MuiLocalizationProvider.defaultProps.localeText}>
      <DatePicker
        slots={{
          openPickerButton: PickerIconButton,
          previousIconButton: PickerIconButton,
          nextIconButton: PickerIconButton,
          switchViewButton: PickerIconButton,
        }}
        label={label}
        disabled={disabled}
        shouldDisableMonth={availableMonths ? (date) => !availableMonths.includes(date.format('YYYY-MM')) : undefined}
        shouldDisableYear={availableMonths ? (date) => !availableMonths.some((month) => month.startsWith(date.format('YYYY-'))) : undefined}
        views={monthOnly ? ['year', 'month'] : undefined}
        openTo={monthOnly ? 'month' : undefined}
        minDate={minDate ? dayjs(minDate) : undefined}
        maxDate={maxDate ? dayjs(maxDate) : undefined}
        value={confirmOnAccept && draft !== undefined ? draft : value ? dayjs(value) : null}
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
