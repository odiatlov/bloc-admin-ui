import React from 'react'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

export type SectionVisibilityOption<T extends string = string> = {
  id: T
  label: string
}

type SectionVisibilitySelectorProps<T extends string = string> = {
  ariaLabel: string
  label: string
  minimumVisibleMessage?: string
  onToggle: (id: T) => void
  options: SectionVisibilityOption<T>[]
  visibleCountLabel: string
  visibleIds: T[]
}

const SectionVisibilitySelector = <T extends string>({
  ariaLabel,
  label,
  minimumVisibleMessage,
  onToggle,
  options,
  visibleCountLabel,
  visibleIds,
}: SectionVisibilitySelectorProps<T>) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const visibleIdSet = React.useMemo(() => new Set(visibleIds), [visibleIds])
  const open = Boolean(anchorEl)

  return (
    <>
      <Button
        aria-controls={open ? 'section-visibility-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        size="small"
        variant="outlined"
        sx={{
          flex: '0 0 auto',
          justifyContent: 'space-between',
          minHeight: 40,
          minWidth: { xs: 162, sm: 180 },
        }}
      >
        {label}: {visibleCountLabel}
      </Button>
      <Menu
        anchorEl={anchorEl}
        id="section-visibility-menu"
        onClose={() => setAnchorEl(null)}
        open={open}
        slotProps={{
          paper: {
            sx: {
              minWidth: anchorEl?.clientWidth ?? 220,
            },
          },
        }}
      >
        {options.map((option) => {
          const isVisible = visibleIdSet.has(option.id)
          const isLastVisible = isVisible && visibleIds.length === 1

          return (
            <MenuItem
              disabled={isLastVisible}
              key={option.id}
              onClick={() => {
                if (!isLastVisible) {
                  onToggle(option.id)
                }
              }}
              title={isLastVisible ? minimumVisibleMessage : undefined}
            >
              <Checkbox checked={isVisible} size="small" />
              <ListItemText primary={option.label} />
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}

export default SectionVisibilitySelector
