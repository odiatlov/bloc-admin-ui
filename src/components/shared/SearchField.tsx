import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Tooltip from '@mui/material/Tooltip'
import FormControl from '@mui/material/FormControl'
import OutlinedInput, { type OutlinedInputProps } from '@mui/material/OutlinedInput'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'

type SearchFieldProps = Pick<OutlinedInputProps, 'disabled' | 'fullWidth' | 'size' | 'value' | 'onChange' | 'sx' | 'id'> & {
  label: string
  onClear: () => void
}

const SearchField = ({ label, onClear, sx, fullWidth, size, disabled, ...props }: SearchFieldProps) => {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const clearLabel = `${t('common.clearFilters')}: ${label}`

  return (
  <FormControl className="MuiTextField-root" disabled={disabled} fullWidth={fullWidth} size={size} sx={sx}>
    <OutlinedInput
      {...props}
      type="search"
      inputRef={inputRef}
      placeholder={label}
      inputProps={{ 'aria-label': label }}
      sx={{ '& input::-webkit-search-cancel-button': { WebkitAppearance: 'none' } }}
      startAdornment={(
        <InputAdornment position="start">
          <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        </InputAdornment>
      )}
      endAdornment={(
        <InputAdornment position="end" sx={{ visibility: props.value ? 'visible' : 'hidden' }}>
          <Tooltip title={clearLabel}>
            <IconButton
              aria-label={clearLabel}
              disabled={disabled}
              size="small"
              sx={{ color: 'text.secondary' }}
              onClick={() => {
                onClear()
                inputRef.current?.focus()
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </InputAdornment>
      )}
    />
  </FormControl>
  )
}

export default SearchField
