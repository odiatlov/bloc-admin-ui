import InputAdornment from '@mui/material/InputAdornment'
import FormControl from '@mui/material/FormControl'
import OutlinedInput, { type OutlinedInputProps } from '@mui/material/OutlinedInput'
import SearchIcon from '@mui/icons-material/Search'

type SearchFieldProps = Pick<OutlinedInputProps, 'disabled' | 'fullWidth' | 'size' | 'value' | 'onChange' | 'sx' | 'id'> & {
  label: string
}

const SearchField = ({ label, sx, fullWidth, size, disabled, ...props }: SearchFieldProps) => (
  <FormControl className="MuiTextField-root" disabled={disabled} fullWidth={fullWidth} size={size} sx={sx}>
    <OutlinedInput
      {...props}
      type="search"
      placeholder={label}
      inputProps={{ 'aria-label': label }}
      startAdornment={(
        <InputAdornment position="start">
          <SearchIcon fontSize="small" />
        </InputAdornment>
      )}
    />
  </FormControl>
)

export default SearchField
