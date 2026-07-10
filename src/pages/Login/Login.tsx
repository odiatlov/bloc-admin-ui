import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'
import { RoleContext } from '../../contexts/RoleContext'
import { useTranslation } from 'react-i18next'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { account, accounts, accountsLoading, login } = React.useContext(RoleContext)
  const [accountId, setAccountId] = React.useState(account.id)
  const selectedAccount = accounts.find((item) => item.id === accountId) ?? accounts[0]

  React.useEffect(() => {
    if (accounts.some((item) => item.id === accountId)) return
    setAccountId(accounts[0]?.id ?? account.id)
  }, [account.id, accountId, accounts])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedAccount) return
    login(accountId)
    navigate(selectedAccount.defaultRole === 'SuperAdmin' ? '/superadmin/dashboard' : '/admin/dashboard', { replace: true })
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Paper component="form" onSubmit={handleSubmit} sx={{ width: 'min(100%, 440px)', p: 3, display: 'grid', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>{t('app.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('auth.login.description')}
          </Typography>
        </Box>
        <TextField
          select
          label={t('auth.login.userAccount')}
          value={accountId}
          onChange={(event) => {
            const nextAccount = accounts.find((item) => item.id === event.target.value) ?? accounts[0]
            setAccountId(nextAccount.id)
          }}
          fullWidth
          disabled={accountsLoading}
        >
          {accounts.map((item) => (
            <MenuItem key={item.id} value={item.id}>
            {item.name}
          </MenuItem>
        ))}
        </TextField>
        {accountsLoading ? (
          <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">{t('auth.login.loadingAccounts')}</Typography>
          </Box>
        ) : null}
        <TextField label={t('residents.fields.email')} value={selectedAccount?.email ?? ''} fullWidth disabled />
        <TextField label={t('auth.login.password')} type="password" value="demo-password" fullWidth disabled />
        <Button type="submit" variant="contained" size="large" disabled={accountsLoading || !selectedAccount}>
          {t('auth.login.submit')}
        </Button>
      </Paper>
    </Box>
  )
}

export default Login
