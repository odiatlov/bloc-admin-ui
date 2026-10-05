import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import IconButtonTooltip from './IconButtonTooltip'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export type ActionButtonDefinition = {
  id: string
  label: string
  icon: React.ReactNode
  onClick?: () => void
  to?: string
  visible?: boolean
  disabled?: boolean
  loading?: boolean
  color?: 'primary' | 'error'
  priority?: number
  cardLabel?: string
  cardIcon?: boolean
}

type ActionButtonsProps = {
  actions: ActionButtonDefinition[]
  variant: 'row' | 'card'
}

const iconButtonSx = {
  width: 32,
  height: 32,
  border: 0,
  bgcolor: 'transparent',
  '& .MuiSvgIcon-root': { fontSize: 20 },
  '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
}

const cardButtonSx = {
  justifyContent: 'center',
  minHeight: 40,
  minWidth: 0,
  width: '100%',
  whiteSpace: 'normal',
  overflowWrap: 'anywhere',
  boxShadow: 'none',
  bgcolor: 'transparent',
  px: 1.5,
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ actions, variant }) => {
  const { t } = useTranslation()
  const menuId = React.useId()
  const visible = actions.filter((action) => action.visible !== false)
  const inline = [...visible].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)).slice(0, 1)
  const overflow = visible.filter((action) => !inline.includes(action))
  const actionIds = overflow.map((action) => action.id).join('|')
  const [menu, setMenu] = React.useState<{ anchor: HTMLElement; actionIds: string } | null>(null)
  const menuOpen = Boolean(menu && menu.actionIds === actionIds && overflow.length)
  const closeMenu = () => setMenu(null)
  const moreLabel = t('common.moreActions')

  if (visible.length === 0) return null

  return (
    <Box sx={variant === 'row'
      ? { display: 'flex', alignItems: 'center', gap: 0.5, width: 'max-content' }
      : {
        display: 'grid',
        alignItems: 'center',
        gap: 1,
        minWidth: 0,
        width: '100%',
        gridTemplateColumns: overflow.length > 0 ? 'minmax(0, 1fr) 32px' : 'minmax(0, 1fr)',
      }}
      onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
      {inline.map((action) => variant === 'card' ? (
          <Box key={action.id} component="span" sx={{ display: 'flex', minWidth: 0, width: '100%' }}>
            <Button {...(action.to ? { component: RouterLink, to: action.to } : {})}
              size="small" variant="outlined" color={action.color ?? 'primary'}
              disabled={action.disabled || action.loading} aria-busy={action.loading || undefined}
              aria-label={action.label}
              sx={cardButtonSx}
              startIcon={action.loading ? <CircularProgress size={18} color="inherit" /> : action.cardIcon === false ? undefined : action.icon}
              onClick={action.onClick}>
              {action.cardLabel ?? action.label}
            </Button>
          </Box>
      ) : (
        <IconButtonTooltip key={action.id} title={action.label}>
          <Box component="span" sx={{ display: 'inline-flex', width: 32, height: 32 }}>
            <IconButton
              {...(action.to ? { component: RouterLink, to: action.to } : {})}
              aria-label={action.label}
              aria-busy={action.loading || undefined}
              color={action.color ?? 'default'}
              disabled={action.disabled || action.loading}
              onClick={action.onClick}
              size="small"
              sx={iconButtonSx}
            >
              {action.loading ? <CircularProgress size={18} color="inherit" /> : action.icon}
            </IconButton>
          </Box>
        </IconButtonTooltip>
      ))}
      {overflow.length > 0 && (
        <>
          <IconButtonTooltip title={moreLabel}>
            <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>
            <IconButton aria-label={moreLabel} aria-haspopup="menu"
              aria-controls={menuOpen ? menuId : undefined} aria-expanded={menuOpen || undefined}
              disabled={variant === 'card' && overflow.every((action) => action.disabled || action.loading)}
              onClick={(event) => setMenu({ anchor: event.currentTarget, actionIds })}
              size="small" sx={iconButtonSx}>
              <MoreVertIcon />
            </IconButton>
            </Box>
          </IconButtonTooltip>
          <Menu id={menuId} anchorEl={menu?.anchor ?? null} open={menuOpen} onClose={closeMenu}>
            {overflow.map((action) => (
              <MenuItem key={action.id}
                {...(action.to ? { component: RouterLink, to: action.to } : {})}
                disabled={action.disabled || action.loading}
                aria-busy={action.loading || undefined}
                sx={action.color ? { color: `${action.color}.main` } : undefined}
                onClick={() => { closeMenu(); action.onClick?.() }}>
                <ListItemIcon sx={{ color: 'inherit' }}>
                  {action.loading ? <CircularProgress size={18} color="inherit" /> : action.icon}
                </ListItemIcon>
                <ListItemText>{action.label}</ListItemText>
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </Box>
  )
}

export default ActionButtons
