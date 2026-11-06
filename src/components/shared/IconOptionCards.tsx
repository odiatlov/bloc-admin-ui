import type { ReactNode } from 'react'
import { Box, Radio, RadioGroup, Typography } from '@mui/material'

type IconOption<T extends string> = {
  value: T
  label: string
  icon: ReactNode
  caption?: string
  disabled?: boolean
}

type Props<T extends string> = {
  label: string
  value: T
  options: readonly IconOption<T>[]
  disabled?: boolean
  onChange?: (value: T) => void
}

export default function IconOptionCards<T extends string>({ label, value, options, disabled, onChange }: Props<T>) {
  return <RadioGroup aria-label={label} value={value} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
    {options.map(option => {
      const unavailable = disabled || option.disabled
      return <Box key={option.value} component="label" sx={{
        border: '2px solid', borderColor: value === option.value ? 'primary.main' : 'divider',
        borderRadius: 1, p: 2, display: 'flex', alignItems: 'center', gap: 1,
        color: unavailable ? 'text.disabled' : 'text.primary', cursor: unavailable ? 'default' : 'pointer',
        '&:hover': { bgcolor: unavailable ? undefined : 'action.hover' },
        '&:focus-within': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
      }}>
        <Radio value={option.value} disabled={unavailable} onChange={() => onChange?.(option.value)} />
        {option.icon}
        <Box sx={{ minWidth: 0 }}>
          <Typography>{option.label}</Typography>
          {option.caption && <Typography variant="caption" component="div">{option.caption}</Typography>}
        </Box>
      </Box>
    })}
  </RadioGroup>
}
