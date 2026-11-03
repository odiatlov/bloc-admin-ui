import React from 'react'
import { Alert, Autocomplete, Box, Button, Checkbox, CircularProgress, FormControlLabel, IconButton, InputAdornment, Radio, RadioGroup, TextField, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { useTranslation } from 'react-i18next'
import AppDialog from '../../../../../components/shared/AppDialog'
import ConfirmationDialog from '../../../../../components/shared/ConfirmationDialog'
import IconButtonTooltip from '../../../../../components/shared/IconButtonTooltip'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { useFinanceActionScope, useFinanceIdentity } from '../../../../../hooks/useFinanceWorkspace'
import { financeReviewApi, financeReviewChanged } from '../../../../../services/financeReviewApi'
import { financeReviewError } from '../../../../../services/financeReviewErrors'
import type { BlockCensor, CensorCandidate, SaveBlockCensor } from '../../../../../types/financeReview'

const CensorEditor = ({ blockId }: { blockId: string }) => {
  const { t } = useTranslation()
  const { refreshAccounts } = React.useContext(RoleContext)
  const active = useFinanceActionScope()
  const [retry, setRetry] = React.useState(0)
  const [current, setCurrent] = React.useState<BlockCensor>()
  const [loadError, setLoadError] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [mode, setMode] = React.useState<'External' | 'Resident'>('External')
  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [candidate, setCandidate] = React.useState<CensorCandidate | null>(null)
  const [query, setQuery] = React.useState('')
  const [page, setPage] = React.useState(1)
  const [candidateRetry, setCandidateRetry] = React.useState(0)
  const [options, setOptions] = React.useState<{ key: string; items: CensorCandidate[]; count: number; page: number }>()
  const [candidateError, setCandidateError] = React.useState(false)
  const [candidateLoading, setCandidateLoading] = React.useState(false)
  const [confirmed, setConfirmed] = React.useState(false)
  const [removing, setRemoving] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')
  const busy = React.useRef(false)
  const searchKey = `${blockId}:${query}`
  React.useEffect(() => {
    const abort = new AbortController()
    financeReviewApi.censor(blockId, abort.signal).then(value => { if (!abort.signal.aborted) { setCurrent(value); setLoadError(false) } })
      .catch(() => { if (!abort.signal.aborted) setLoadError(true) })
    return () => abort.abort()
  }, [blockId, retry])
  React.useEffect(() => {
    if (!open || mode !== 'Resident') return
    const abort = new AbortController()
    const timer = window.setTimeout(() => {
      setCandidateLoading(true); setCandidateError(false)
      financeReviewApi.candidates(blockId, query, page, abort.signal).then(result => {
        if (!abort.signal.aborted) setOptions(previous => ({ key: searchKey, page, count: result.totalCount,
          items: page > 1 && previous?.key === searchKey ? [...previous.items, ...result.items.filter(x => !previous.items.some(p => p.personId === x.personId))] : result.items }))
      }).catch(() => { if (!abort.signal.aborted) setCandidateError(true) })
        .finally(() => { if (!abort.signal.aborted) setCandidateLoading(false) })
    }, 250)
    return () => { abort.abort(); window.clearTimeout(timer) }
  }, [blockId, candidateRetry, mode, open, page, query, searchKey])
  const start = () => {
    setCurrent(undefined); setLoadError(false); setRetry(x => x + 1)
    setMode('External'); setFirstName(''); setLastName(''); setPhone(''); setEmail(''); setCandidate(null)
    setQuery(''); setPage(1); setOptions(undefined); setCandidateLoading(false); setCandidateError(false); setConfirmed(false); setError(''); setOpen(true)
  }
  const save = async (remove = false) => {
    if (!current || busy.current) return
    busy.current = true; setSaving(true); setError('')
    const request: SaveBlockCensor = { mode: remove ? 'Remove' : mode, expectedAssignmentId: current.assignmentId,
      confirmReplacement: remove || confirmed, personId: candidate?.personId, email: email.trim(),
      ...(mode === 'External' && !remove ? { externalPerson: { firstName: firstName.trim(), lastName: lastName.trim(),
        email: email.trim(), phone: phone.trim() || null, status: 'active' as const, invitePerson: true as const } } : {}) }
    try {
      const result = await financeReviewApi.saveCensor(blockId, request)
      if (!active.current) return
      setCurrent(result); setOpen(false); setRemoving(false); financeReviewChanged()
      await refreshAccounts()
    } catch (nextError) { if (active.current) setError(financeReviewError(nextError, t)) }
    finally { busy.current = false; if (active.current) setSaving(false) }
  }
  const needsAccount = mode === 'External' || !candidate?.hasRegisteredAccount
  const emailValid = !needsAccount || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const valid = !!current && !saving && emailValid && (!current.assignmentId || confirmed)
    && (mode === 'External' ? !!firstName.trim() && !!lastName.trim() : !!candidate)
  const choices = options?.key === searchKey ? options.items : []
  return <Box sx={{ display: 'grid', gap: 1 }}>
    {loadError ? <LoadErrorState helperText={t('financeReview.settings.loadFailed')} onRetry={() => { setCurrent(undefined); setLoadError(false); setRetry(x => x + 1) }} />
      : !current ? <CircularProgress size={24} aria-label={t('persons.loading')} /> : <TextField
        fullWidth size="small" label={t('financeReview.settings.field')} value={current.fullName ?? t('financeReview.settings.none')}
        onClick={start} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); start() } }}
        helperText={t('financeReview.settings.blockScope')}
        slotProps={{ input: { readOnly: true, endAdornment: <InputAdornment position="end"><IconButtonTooltip title={t('financeReview.settings.change')}>
          <IconButton size="small" aria-label={t('financeReview.settings.change')} onClick={event => { event.stopPropagation(); start() }}><EditIcon /></IconButton>
        </IconButtonTooltip></InputAdornment> } }} />}
    <AppDialog open={open} title={t('financeReview.settings.title')} maxWidth="sm" pending={saving}
      cancelLabel={t('common.cancel')} confirmLabel={t(current?.assignmentId ? 'financeReview.settings.replace' : 'financeReview.settings.assign')}
      confirmDisabled={!valid} onCancel={() => { if (!saving) setOpen(false) }} onConfirm={() => { void save() }}
      contentSx={{ display: 'grid', gap: 2 }}>
      {!current && !loadError && <CircularProgress size={24} aria-label={t('persons.loading')} />}
      <RadioGroup value={mode} onChange={event => { setMode(event.target.value as typeof mode); setConfirmed(false); setError(''); setEmail('') }}>
        <FormControlLabel value="External" control={<Radio disabled={saving} />} label={t('financeReview.settings.external')} />
        <FormControlLabel value="Resident" control={<Radio disabled={saving} />} label={t('financeReview.settings.resident')} />
      </RadioGroup>
      {mode === 'External' ? <>
        <Alert severity="info">{t('financeReview.settings.externalHelp')}</Alert>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
          <TextField required size="small" disabled={saving} label={t('persons.fields.firstName')} value={firstName} onChange={e => setFirstName(e.target.value)} />
          <TextField required size="small" disabled={saving} label={t('persons.fields.lastName')} value={lastName} onChange={e => setLastName(e.target.value)} />
        </Box>
        <TextField size="small" disabled={saving} label={t('persons.fields.phoneOptional')} value={phone} onChange={e => setPhone(e.target.value)} />
      </> : <>
        <Autocomplete options={choices} value={candidate} disabled={saving} loading={!candidateError && (candidateLoading || options?.key !== searchKey)}
          filterOptions={items => items} isOptionEqualToValue={(a, b) => a.personId === b.personId}
          getOptionLabel={item => t('financeReview.settings.candidate', { name: item.fullName, apartments: item.apartments.join(', ') })}
          onInputChange={(_event, value, reason) => { if (reason === 'input' || reason === 'clear') { setQuery(value); setPage(1) } }}
          onChange={(_event, value) => { setCandidate(value); setEmail(''); setConfirmed(false) }}
          noOptionsText={t(candidateError ? 'financeReview.settings.loadFailed' : 'financeReview.settings.noResidents')} loadingText={t('persons.loading')}
          renderInput={params => <TextField {...params} size="small" label={t('financeReview.settings.search')} />} />
        {candidateError && <LoadErrorState helperText={t('financeReview.settings.loadFailed')} onRetry={() => setCandidateRetry(x => x + 1)} />}
        {!candidateError && options?.key === searchKey && options.count > choices.length && <Button disabled={candidateLoading || saving}
          onClick={() => setPage(options.page + 1)}>{t('financeReview.settings.more')}</Button>}
        <Typography variant="body2" color="text.secondary">{t('financeReview.settings.residentHelp')}</Typography>
      </>}
      {needsAccount && <TextField required fullWidth size="small" type="email" disabled={saving} label={t('persons.fields.email')}
        value={email} onChange={e => setEmail(e.target.value)} helperText={t('financeReview.settings.accountHelp')} />}
      {current?.assignmentId && <>
        <Alert severity="warning">{t('financeReview.settings.replacing', { current: current.fullName ?? '—', next: mode === 'Resident' ? candidate?.fullName ?? '—' : `${firstName} ${lastName}`.trim() || '—' })}</Alert>
        <FormControlLabel control={<Checkbox checked={confirmed} disabled={saving} onChange={e => setConfirmed(e.target.checked)} />} label={t('financeReview.settings.confirmReplace')} />
        <Button variant="outlined" color="error" disabled={saving} onClick={() => setRemoving(true)}>{t('financeReview.settings.remove')}</Button>
      </>}
      {error && <Alert severity="error">{error}</Alert>}
      {open && !current && loadError && <LoadErrorState helperText={t('financeReview.settings.loadFailed')} onRetry={() => { setLoadError(false); setRetry(x => x + 1) }} />}
    </AppDialog>
    <ConfirmationDialog open={removing} title={t('financeReview.settings.remove')} confirmColor="error" confirmDisabled={saving}
      confirmLabel={t('financeReview.settings.remove')} cancelLabel={t('common.cancel')}
      onCancel={() => { if (!saving) setRemoving(false) }} onConfirm={() => { void save(true) }}>
      <Typography>{t('financeReview.settings.removeHelp', { name: current?.fullName })}</Typography>
      {error && <Alert severity="error">{error}</Alert>}
    </ConfirmationDialog>
  </Box>
}

export default function BlockCensorField({ blockId }: { blockId: string }) {
  const identity = useFinanceIdentity()
  return <CensorEditor key={`${identity}:${blockId}`} blockId={blockId} />
}
