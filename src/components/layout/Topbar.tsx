import React from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import InputBase from '@mui/material/InputBase'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

type Props = {
  drawerWidth?: number
}

const Topbar: React.FC<Props> = ({ drawerWidth = 240 }) => {
  return (
    <AppBar
      position="fixed"
      sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Admin
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <InputBase placeholder="Search…" sx={{ bgcolor: 'rgba(255,255,255,0.08)', px: 1, borderRadius: 1, mr: 2 }} />
        <Button color="inherit">Profile</Button>
      </Toolbar>
    </AppBar>
  )
}

export default Topbar
