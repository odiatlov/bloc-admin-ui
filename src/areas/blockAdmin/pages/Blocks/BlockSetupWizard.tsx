import React from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Checkbox, FormControlLabel, IconButton, MenuItem, Radio, RadioGroup, Step, StepLabel, Stepper, TextField, Tooltip, Typography } from '@mui/material'
import ApartmentIcon from '@mui/icons-material/Apartment'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useTranslation } from 'react-i18next'
import AppDialog from '../../../../components/shared/AppDialog'
import ConfirmationDialog from '../../../../components/shared/ConfirmationDialog'
import type { BlockSetupRequest, CreateBlockRequest, SetupApartment } from '../../../../types/block'
import BlockFields from './BlockFields'
import ApartmentSetupFields from '../Apartments/components/ApartmentSetupFields'
import { ApiError } from '../../../../services/apiClient'
import { translateApartmentSetupStatus } from '../../../../domain/displayLabels'
import { generateBatch, generateStaircases, newApartment, newGroup, unique, validApartment, type ApartmentDraft, type Group } from './setupDraft'
const toApartment = (a: ApartmentDraft): SetupApartment => ({ number: a.number.trim(), floor: a.floor.trim() ? Number(a.floor) : null,
  usableSqm: a.usableSqm.trim() ? Number(a.usableSqm) : null, setupStatus: a.setupStatus, hasBoiler: a.hasBoiler })

export default function BlockSetupWizard({ onClose, onSimple, onSetup }: {
  onClose: () => void; onSimple: (request: CreateBlockRequest) => Promise<void>; onSetup: (request: BlockSetupRequest) => Promise<void>
}) {
  const { t } = useTranslation()
  const w = (key: string, values?: Record<string, unknown>) => t(`blockSetup.${key}`, values)
  const [mode, setMode] = React.useState<'simple' | 'full'>('simple')
  const [stage, setStage] = React.useState(-1)
  const [name, setName] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [hasStaircases, setHasStaircases] = React.useState(true)
  const [staircases, setStaircases] = React.useState<Group[]>([])
  const [blockGroup, setBlockGroup] = React.useState<Group>(() => newGroup())
  const [batchStart, setBatchStart] = React.useState('1')
  const [batchQuantity, setBatchQuantity] = React.useState('1')
  const [staircaseNaming, setStaircaseNaming] = React.useState<'alphabetical' | 'numeric'>('alphabetical')
  const [staircaseQuantity, setStaircaseQuantity] = React.useState('1')
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const submitting = React.useRef(false)
  const [confirmation, setConfirmation] = React.useState<(() => void) | null>(null)
  const [requestId] = React.useState(() => crypto.randomUUID())
  const [retryRequest, setRetryRequest] = React.useState<BlockSetupRequest | null>(null)
  const groups = hasStaircases ? staircases : [blockGroup]
  const steps = ['details', ...(hasStaircases ? ['staircases'] : []), 'apartments', 'review']
  const current = steps[stage]
  const populated = Boolean(name || address || staircases.length || blockGroup.apartments.length)
  const ask = (action: () => void, needed = populated) => needed ? setConfirmation(() => action) : action()
  const updateGroup = (id: string, update: (group: Group) => Group) => {
    if (hasStaircases) setStaircases(value => value.map(g => g.id === id ? update(g) : g))
    else setBlockGroup(update)
  }
  const validate = (step: string) => {
    if (step === 'details') return Boolean(name.trim())
    if (step === 'staircases') return staircases.length > 0 && staircases.every(g => Boolean(g.name.trim()) && g.name.trim().length <= 100) && unique(staircases.map(g => g.name))
    if (step === 'apartments') return groups.length > 0 && groups.every(g => g.apartments.length > 0 && g.apartments.every(validApartment) && unique(g.apartments.map(a => a.number)))
    return true
  }
  const batch = (group?: Group) => {
    const existing = group ? group.apartments.map(a => a.number) : staircases.map(g => g.name)
    const result = group
      ? generateBatch(Number(batchStart), Number(batchQuantity), '', existing, 50)
      : generateStaircases(staircaseNaming, Number(staircaseQuantity), existing)
    if (result.error) { setError(w(result.error)); return }
    const values = result.values
    if (group) updateGroup(group.id, g => ({ ...g, apartments: [...g.apartments, ...values.map(newApartment)] }))
    else setStaircases(value => [...value, ...values.map(newGroup)])
    setError(null)
  }
  const submit = async () => {
    if (submitting.current) return
    if (!name.trim() || (mode === 'full' && (!validate('apartments') || (hasStaircases && !validate('staircases'))))) { setError(w('validation')); return }
    submitting.current = true; setBusy(true); setError(null)
    try {
      if (mode === 'simple') await onSimple({ name: name.trim(), address: address.trim() || undefined, hasStaircases: false, apartmentCount: 0, residentCount: 0, staircaseCount: 0 })
      else {
        const request = retryRequest ?? { requestId, name: name.trim(), address: address.trim(), hasStaircases,
          staircases: hasStaircases ? staircases.map(g => ({ name: g.name.trim(), apartments: g.apartments.map(toApartment) })) : [],
          apartments: hasStaircases ? [] : blockGroup.apartments.map(toApartment) }
        setRetryRequest(request)
        await onSetup(request)
      }
    } catch (e) {
      if (e instanceof ApiError && e.status >= 400 && e.status < 500) setRetryRequest(null)
      setError(e instanceof Error ? e.message : t('settings.blockDialog.serverError'))
    }
    finally { submitting.current = false; setBusy(false) }
  }
  const next = () => {
    setError(null)
    if (stage === -1) { setStage(0); return }
    if (!validate(current)) { setError(w('validation')); return }
    if (mode === 'simple' || current === 'review') void submit()
    else setStage(value => value + 1)
  }
  const batchControls = (group?: Group) => <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
    {group ? <TextField size="small" type="number" label={w('start')} value={batchStart} onChange={e => setBatchStart(e.target.value)} sx={{ width: 140 }} />
      : <TextField select size="small" label={w('naming')} value={staircaseNaming} onChange={e => setStaircaseNaming(e.target.value as 'alphabetical' | 'numeric')} sx={{ width: { xs: '100%', sm: 240 } }}>
        <MenuItem value="alphabetical">{w('alphabetical')}</MenuItem>
        <MenuItem value="numeric">{w('numeric')}</MenuItem>
      </TextField>}
    <TextField size="small" type="number" label={w('quantity')} value={group ? batchQuantity : staircaseQuantity}
      onChange={e => group ? setBatchQuantity(e.target.value) : setStaircaseQuantity(e.target.value)}
      slotProps={{ htmlInput: { min: 1, max: !group && staircaseNaming === 'alphabetical' ? 26 : 1000, step: 1 } }} sx={{ width: 140 }} />
    <Button startIcon={<AddIcon />} onClick={() => batch(group)}>{w('generate')}</Button>
  </Box>
  const removeButton = (action: () => void) => <Tooltip title={w('remove')}><IconButton aria-label={w('remove')} onClick={action}><DeleteIcon /></IconButton></Tooltip>
  return <>
    <AppDialog open title={w(stage === -1 ? 'chooseTitle' : 'title')} maxWidth="md"
      onCancel={() => { if (!busy) ask(onClose) }} cancelLabel={t('common.cancel')}
      onConfirm={next} confirmDisabled={busy} confirmLabel={busy ? t('settings.blockDialog.saving') : stage === -1 ? w('continue') : mode === 'simple' || current === 'review' ? w('create') : w('next')}
      contentSx={{ display: 'grid', gap: 2, pt: 1 }}>
      {error && <Alert severity="error">{error}</Alert>}
      {retryRequest && <Alert severity="info">{w('retry')}</Alert>}
      {stage === -1 ? <RadioGroup value={mode} onChange={e => {
        const selected = e.target.value as 'simple' | 'full'
        ask(() => { setMode(selected); setName(''); setAddress(''); setStaircases([]); setBlockGroup(newGroup()) })
      }} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        {(['simple', 'full'] as const).map(option => <Box key={option} component="label" sx={{ border: '2px solid', borderColor: mode === option ? 'primary.main' : 'divider', borderRadius: 1, p: 2, display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, '&:focus-within': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 } }}>
          <Radio value={option} />{option === 'simple' ? <ApartmentIcon /> : <AccountTreeIcon />}<Typography>{w(option)}</Typography>
        </Box>)}
      </RadioGroup> : <>
        {mode === 'full' && <>
          <Stepper activeStep={stage} alternativeLabel sx={{ display: { xs: 'none', sm: 'flex' } }}>{steps.map(step => <Step key={step}><StepLabel>{w(step)}</StepLabel></Step>)}</Stepper>
          <Typography sx={{ display: { xs: 'block', sm: 'none' } }}>{w('step', { current: stage + 1, total: steps.length })}: {w(current)}</Typography>
        </>}
        <Box component="fieldset" disabled={busy || Boolean(retryRequest)} sx={{ border: 0, p: 0, m: 0, minWidth: 0, display: 'grid', gap: 2 }}>
          {current === 'details' && <>
            <BlockFields name={name} address={address} onChange={(field, value) => field === 'name' ? setName(value) : setAddress(value)} />
            {mode === 'full' && <FormControlLabel label={w('hasStaircases')} control={<Checkbox checked={hasStaircases} onChange={e => {
              const checked = e.target.checked
              ask(() => { setHasStaircases(checked); setStaircases([]); setBlockGroup(newGroup()) }, staircases.length > 0 || blockGroup.apartments.length > 0)
            }} />} />}
          </>}
          {current === 'staircases' && <>
            {batchControls()}
            {staircases.map(g => <Box key={g.id} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField required fullWidth label={w('staircaseName')} value={g.name} onChange={e => updateGroup(g.id, value => ({ ...value, name: e.target.value }))} />
              {removeButton(() => ask(() => setStaircases(value => value.filter(s => s.id !== g.id)), g.apartments.length > 0))}
            </Box>)}
            <Button startIcon={<AddIcon />} onClick={() => setStaircases(value => [...value, newGroup()])}>{w('addStaircase')}</Button>
          </>}
          {current === 'apartments' && groups.map(g => <Accordion key={g.id} defaultExpanded disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography>{hasStaircases ? g.name : name} ({g.apartments.length})</Typography></AccordionSummary>
            <AccordionDetails sx={{ display: 'grid', gap: 2 }}>
              {batchControls(g)}
              {g.apartments.map(a => {
                const update = (patch: Partial<ApartmentDraft>) => updateGroup(g.id, value => ({ ...value, apartments: value.apartments.map(item => item.id === a.id ? { ...item, ...patch } : item) }))
                return <Box key={a.id} sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2, display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' } }}>
                  <ApartmentSetupFields value={a} onChange={update} />
                  <TextField size="small" type="number" disabled label={t('apartments.setup.householdMembers')} value={0} helperText={t('apartments.setup.assignOwnerBeforeCount')} />
                  <FormControlLabel label={w('boiler')} control={<Checkbox checked={a.hasBoiler} onChange={e => update({ hasBoiler: e.target.checked })} />} />
                  {removeButton(() => updateGroup(g.id, value => ({ ...value, apartments: value.apartments.filter(item => item.id !== a.id) })))}
                </Box>
              })}
              <Button startIcon={<AddIcon />} onClick={() => updateGroup(g.id, value => ({ ...value, apartments: [...value.apartments, newApartment()] }))}>{w('addApartment')}</Button>
            </AccordionDetails>
          </Accordion>)}
          {current === 'review' && <>
            <Typography variant="h6" sx={{ overflowWrap: 'anywhere' }}>{name}</Typography>
            {address && <Typography sx={{ overflowWrap: 'anywhere' }}>{address}</Typography>}
            <Typography>{w('totals', { staircases: hasStaircases ? staircases.length : 0, apartments: groups.reduce((sum, g) => sum + g.apartments.length, 0) })}</Typography>
            {groups.map(g => <Accordion key={g.id} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography sx={{ overflowWrap: 'anywhere' }}>{hasStaircases ? g.name : name} ({g.apartments.length})</Typography></AccordionSummary>
              <AccordionDetails>{g.apartments.map(a => <Typography key={a.id} sx={{ overflowWrap: 'anywhere' }}>
                {t('apartments.setup.number')}: {a.number} · {t('blocks.columns.floor')}: {a.floor || '-'} · {t('blocks.columns.usableSurface')}: {a.usableSqm ? Number(a.usableSqm).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'} · {translateApartmentSetupStatus(t, a.setupStatus)} · {w('boiler')}: {w(a.hasBoiler ? 'yes' : 'no')}
              </Typography>)}</AccordionDetails>
            </Accordion>)}
          </>}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button startIcon={<ArrowBackIcon />} disabled={busy || Boolean(retryRequest)} onClick={() => { setError(null); setStage(value => value - 1) }}>{w('back')}</Button>
          {stage > 0 && <Button disabled={busy || Boolean(retryRequest)} onClick={() => ask(() => { setStage(-1); setName(''); setAddress(''); setStaircases([]); setBlockGroup(newGroup()) })}>{w('changeMode')}</Button>}
        </Box>
      </>}
    </AppDialog>
    <ConfirmationDialog open={Boolean(confirmation)} title={w('discardTitle')} cancelLabel={t('common.cancel')} confirmLabel={w('discard')}
      onCancel={() => setConfirmation(null)} onConfirm={() => { confirmation?.(); setConfirmation(null) }}><Typography>{w('discardMessage')}</Typography></ConfirmationDialog>
  </>
}
