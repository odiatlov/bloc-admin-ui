import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'
import { RoleContext } from '../../contexts/RoleContext'
import { mockAccounts } from '../../mocks/auth'
import type { AuthRole } from '../../types/apartment'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { account, login } = React.useContext(RoleContext)
  const [accountId, setAccountId] = React.useState(account.id)
  const selectedAccount = mockAccounts.find((item) => item.id === accountId) ?? mockAccounts[0]
  const [role, setRole] = React.useState<AuthRole>(selectedAccount.defaultRole)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    login(accountId, role)
    navigate('/admin/dashboard', { replace: true })
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Paper component="form" onSubmit={handleSubmit} sx={{ width: 'min(100%, 440px)', p: 3, display: 'grid', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Block Admin</Typography>
          <Typography variant="body2" color="text.secondary">
            Mock authentication with scoped administrator and resident sessions.
          </Typography>
        </Box>
        <TextField
          select
          label="Demo account"
          value={accountId}
          onChange={(event) => {
            const nextAccount = mockAccounts.find((item) => item.id === event.target.value) ?? mockAccounts[0]
            setAccountId(nextAccount.id)
            setRole(nextAccount.defaultRole)
          }}
          fullWidth
        >
          {mockAccounts.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {item.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField select label="Login role" value={role} onChange={(event) => setRole(event.target.value as AuthRole)} fullWidth>
          {selectedAccount.roles.map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </TextField>
        <TextField label="Email" value={selectedAccount.email} fullWidth disabled />
        <TextField label="Password" type="password" value="demo-password" fullWidth disabled />
        <Button type="submit" variant="contained" size="large">
          Login
        </Button>
      </Paper>
    </Box>
  )
}

export default Login
