import React from 'react'
import { Alert, Box, Button, CircularProgress, Paper, TextField, Typography } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RoleContext } from '../../contexts/RoleContext'
import { ApiError } from '../../services/apiClient'
import LoadErrorState from '../../components/shared/LoadErrorState'
import LoadingState from '../../components/shared/LoadingState'
const safeReturnUrl = (value: unknown): string | undefined =>
  typeof value === 'string' && /^\/(admin|superadmin)(\/|$)/.test(value) && !/[\\\r\n]/.test(value) ? value : undefined
const Login: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const { login, logout, logoutRequested, account, isAuthenticated, accountsLoading, accountsError, refreshAccounts } = React.useContext(RoleContext)
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const retrySession = async () => {
    if (logoutRequested) { try { await logout() } catch { /* The provider keeps the retryable failure visible. */ } }
    else await refreshAccounts()
  }
  React.useEffect(() => {
    if (isAuthenticated && !accountsLoading && !accountsError)
      navigate(safeReturnUrl(location.state?.returnTo) ?? (account.defaultRole === 'SuperAdmin' ? '/superadmin/dashboard' : '/admin/dashboard'), { replace: true })
  }, [isAuthenticated, accountsLoading, accountsError, account.defaultRole, location.state, navigate])
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setPending(true)
    setError(null)
    try { await login(email, password) }
    catch (error) { setError(error instanceof ApiError && error.status === 429 ? 'auth.login.throttled' : 'auth.login.failed') }
    finally { setPassword(''); setPending(false) }
  }
  return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
    <Paper component="form" onSubmit={event => { void handleSubmit(event) }} sx={{ width: 'min(100%, 440px)', p: 3, display: 'grid', gap: 2 }}>
      <Box><Typography variant="h4" sx={{ fontWeight: 800 }}>{t('app.title')}</Typography>
        <Typography variant="body2" color="text.secondary">{t('auth.login.description')}</Typography></Box>
      {accountsLoading ? <LoadingState label={t(logoutRequested ? 'auth.logout.pending' : 'auth.login.checking')} showLabel={logoutRequested} /> : accountsError
        ? <LoadErrorState helperText={t(logoutRequested ? 'auth.logout.unavailable' : 'auth.login.unavailable')} onRetry={retrySession} /> : <>
          {error && <Alert severity="error">{t(error)}</Alert>}
          <TextField label={t('persons.fields.email')} type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required fullWidth disabled={pending} slotProps={{ htmlInput: { maxLength: 320 } }} />
          <TextField label={t('auth.login.password')} type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required fullWidth disabled={pending} slotProps={{ htmlInput: { maxLength: 128 } }} />
          <Button type="submit" variant="contained" size="large" disabled={pending}>{pending ? <CircularProgress size={22} color="inherit" aria-label={t('auth.login.submit')} /> : t('auth.login.submit')}</Button>
        </>}
    </Paper>
  </Box>
}
export default Login
