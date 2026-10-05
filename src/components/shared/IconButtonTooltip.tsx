import type React from 'react'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'

type IconButtonTooltipProps = {
  title: string
  children: React.ReactElement<{ disabled?: boolean }>
}

const IconButtonTooltip: React.FC<IconButtonTooltipProps> = ({ title, children }) => (
  <Tooltip title={title} followCursor>
    {children.props.disabled
      ? <Box component="span" sx={{ display: 'inline-flex', verticalAlign: 'middle' }}>{children}</Box>
      : children}
  </Tooltip>
)

export default IconButtonTooltip
