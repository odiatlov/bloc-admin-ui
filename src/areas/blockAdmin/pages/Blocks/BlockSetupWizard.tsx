import React from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Card, Checkbox, FormControlLabel, IconButton, MenuItem, Radio, RadioGroup, Snackbar, Step, StepLabel, Stepper, Switch, TextField, Tooltip, Typography } from '@mui/material'
import ApartmentIcon from '@mui/icons-material/Apartment'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import AddIcon from '@mui/icons-material/Add'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { lighten, useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTranslation } from 'react-i18next'
import AppDialog from '../../../../components/shared/AppDialog'
import ConfirmationDialog from '../../../../components/shared/ConfirmationDialog'
import type { BlockSetupRequest, CreateBlockRequest, SetupApartment } from '../../../../types/block'
import BlockFields from './BlockFields'
import ApartmentSetupFields from '../Apartments/components/ApartmentSetupFields'
import { ApiError } from '../../../../services/apiClient'
import { translateApartmentSetupStatus } from '../../../../domain/displayLabels'
import { generateStaircases, newApartment, newGroup, planApartmentBatch, unique, validApartment, type ApartmentDraft, type GenerationSettings, type Group } from './setupDraft'
const toApartment = (a: ApartmentDraft): SetupApartment => ({ number: a.number.trim(), floor: a.floor.trim() ? Number(a.floor) : null,
  usableSqm: a.usableSqm.trim() ? Number(a.usableSqm) : null, setupStatus: a.setupStatus, hasBoiler: a.hasBoiler })

export default function BlockSetupWizard({ onClose, onSimple, onSetup }: {
  onClose: () => void; onSimple: (request: CreateBlockRequest) => Promise<void>; onSetup: (request: BlockSetupRequest) => Promise<void>
}) {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const w = (key: string, values?: Record<string, unknown>) => t(`blockSetup.${key}`, values)
  const caption = (key: string) => w(isMobile ? `mobile.${key}` : key)
  const [mode, setMode] = React.useState<'simple' | 'full'>('simple')
  const [stage, setStage] = React.useState(-1)
  const [name, setName] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [hasStaircases, setHasStaircases] = React.useState(true)
  const [staircases, setStaircases] = React.useState<Group[]>([])
  const [blockGroup, setBlockGroup] = React.useState<Group>(() => newGroup())
  const [copyNotice, setCopyNotice] = React.useState<string | null>(null)
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
  const updateGeneration = (group: Group, patch: Partial<GenerationSettings>) => updateGroup(group.id, current => ({ ...current, generation: { ...current.generation, ...patch } }))
  const copyGeneration = (source: Group) => {
    if (busy || retryRequest) return
    setStaircases(current => current.map(group => group.id === source.id ? group : { ...group, generation: { ...source.generation } }))
    setCopyNotice(source.name)
  }
  const validate = (step: string) => {
    if (step === 'details') return Boolean(name.trim())
    if (step === 'staircases') return staircases.length > 0 && staircases.every(g => Boolean(g.name.trim()) && g.name.trim().length <= 100) && unique(staircases.map(g => g.name))
    if (step === 'apartments') return groups.length > 0 && groups.every(g => g.apartments.length > 0 && g.apartments.every(validApartment) && unique(g.apartments.map(a => a.number)))
    return true
  }
  const batch = () => {
    const result = generateStaircases(staircaseNaming, Number(staircaseQuantity), staircases.map(g => g.name))
    if (result.error) { setError(w(result.error)); return }
    setStaircases(value => [...value, ...result.values.map(newGroup)])
    setError(null)
  }
  const generateApartments = (group: Group) => {
    if (busy || retryRequest) return
    const result = planApartmentBatch(group)
    if (result.error) {
      setError(w('generationError', { location: hasStaircases ? group.name : name, reason: w(result.error) })); return
    }
    const generated = result.values.map(value => ({ ...newApartment(value.number), ...value }))
    updateGroup(group.id, current => ({ ...current, apartments: [...current.apartments, ...generated] }))
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
  const batchControls = (group?: Group) => <Box sx={{
    display: 'grid', gap: 1.5, alignItems: 'start',
    gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: group ? 'repeat(5, minmax(0, 1fr))' : 'minmax(0, 2fr) minmax(0, 1fr) max-content' },
    '@media (max-width: 359px)': { gridTemplateColumns: 'minmax(0, 1fr)' },
    '& .MuiTextField-root': { width: '100%', minWidth: 0 },
  }}>
    {group ? <TextField required size="small" type="number" label={caption('start')} value={group.generation.start} onChange={e => updateGeneration(group, { start: e.target.value })} />
      : <TextField select size="small" label={caption('naming')} value={staircaseNaming} onChange={e => setStaircaseNaming(e.target.value as 'alphabetical' | 'numeric')}>
        <MenuItem value="alphabetical">{w('alphabetical')}</MenuItem>
        <MenuItem value="numeric">{w('numeric')}</MenuItem>
      </TextField>}
    <TextField required={Boolean(group)} size="small" type="number" label={caption('quantity')} value={group ? group.generation.quantity : staircaseQuantity}
      onChange={e => group ? updateGeneration(group, { quantity: e.target.value }) : setStaircaseQuantity(e.target.value)}
      slotProps={{ htmlInput: { min: 1, max: !group && staircaseNaming === 'alphabetical' ? 26 : 1000, step: 1 } }} />
    {group && <>
      <TextField required size="small" type="number" label={caption('startingFloor')} value={group.generation.startingFloor} onChange={e => updateGeneration(group, { startingFloor: e.target.value })}
        slotProps={{ htmlInput: { min: -2147483648, max: 2147483647, step: 1 } }} />
      <TextField required size="small" type="number" label={caption('apartmentsPerFloor')} value={group.generation.apartmentsPerFloor} onChange={e => updateGeneration(group, { apartmentsPerFloor: e.target.value })}
        slotProps={{ htmlInput: { min: 1, step: 1 } }} />
      <TextField required size="small" type="number" label={isMobile ? w('mobile.usableSqm') : t('blocks.columns.usableSurface')} value={group.generation.usableSqm} onChange={e => updateGeneration(group, { usableSqm: e.target.value })}
        slotProps={{ htmlInput: { min: 0, step: 0.01 } }} sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }} />
    </>}
    {!group && <Button variant="outlined" startIcon={<AutoAwesomeIcon />} onClick={batch} sx={{ gridColumn: { xs: '1 / -1', md: 'auto' }, minHeight: 40 }}>{w('generate')}</Button>}
  </Box>
  const removeButton = (action: () => void) => <Tooltip title={w('remove')}><IconButton aria-label={w('remove')} onClick={action}><DeleteIcon /></IconButton></Tooltip>
  return <>
    <AppDialog open title={w(stage === -1 ? 'chooseTitle' : 'title')} maxWidth="md"
      onCancel={() => { if (!busy) ask(onClose) }} cancelLabel={t('common.cancel')}
      hideCancelButton showCloseButton closeLabel={t('common.close')} closeDisabled={busy}
      onBack={stage >= 0 ? () => { setError(null); setStage(value => value - 1) } : undefined}
      backLabel={w('back')} backDisabled={busy || Boolean(retryRequest)}
      onConfirm={next} confirmDisabled={busy} confirmLabel={busy ? t('settings.blockDialog.saving') : stage === -1 ? w('continue') : mode === 'simple' || current === 'review' ? w('create') : w('next')}
      dialogContentSx={{ pt: '4px !important', px: { xs: 2, sm: 3 } }}
      contentSx={{ display: 'grid', gap: 2, pt: 0 }}>
      {error && <Alert severity="error" onClose={() => setError(null)} closeText={t('common.close')}
        sx={{ '& .MuiAlert-action': { alignItems: 'flex-start', pt: 0 } }}>{error}</Alert>}
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
          <Stepper activeStep={stage} aria-label={w('step', { current: stage + 1, total: steps.length })}
            sx={{ display: { xs: 'flex', sm: 'none' }, py: 0.5 }}>
            {steps.map((step, index) => <Step key={step} completed={false} active={index <= stage} aria-current={index === stage ? 'step' : undefined}>
              <StepLabel aria-label={w(step)} />
            </Step>)}
          </Stepper>
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
            <Box id={`setup-header-${g.id}`} aria-controls={`setup-apartments-${g.id}`} sx={{ position: 'relative' }}>
              <AccordionSummary id={`setup-toggle-${g.id}`} aria-controls={`setup-apartments-${g.id}`} expandIcon={<ExpandMoreIcon />}
                sx={{ '& .MuiAccordionSummary-content': { pr: hasStaircases ? 22 : 17, minWidth: 0 } }}>
                <Typography sx={{ overflowWrap: 'anywhere' }}>{hasStaircases ? g.name : name} ({g.apartments.length})</Typography>
              </AccordionSummary>
              <Tooltip title={hasStaircases ? w('generateStaircase', { staircase: g.name }) : w('generate')}>
                <Box component="span" sx={{ position: 'absolute', right: hasStaircases ? 80 : 44, top: '50%', transform: 'translateY(-50%)' }}>
                  <Button size="small" variant="outlined" startIcon={<AutoAwesomeIcon fontSize="small" />} aria-label={hasStaircases ? w('generateStaircase', { staircase: g.name }) : w('generate')}
                    disabled={busy || Boolean(retryRequest)}
                    sx={{ width: 112, minHeight: 32, px: 1 }}
                    onClick={event => { event.stopPropagation(); generateApartments(g) }}>
                    {w('generate')}
                  </Button>
                </Box>
              </Tooltip>
              {hasStaircases && <Tooltip title={w('copyGeneration')}>
                <span style={{ position: 'absolute', right: 44, top: '50%', transform: 'translateY(-50%)' }}>
                  <IconButton size="small" aria-label={w('copyGeneration')} color="primary" disabled={busy || Boolean(retryRequest) || staircases.length < 2}
                    onClick={event => { event.stopPropagation(); copyGeneration(g) }}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>}
            </Box>
            <AccordionDetails sx={{ display: 'grid', gap: 2 }}>
              {batchControls(g)}
              {g.apartments.map((a, index) => {
                const update = (patch: Partial<ApartmentDraft>) => updateGroup(g.id, value => ({ ...value, apartments: value.apartments.map(item => item.id === a.id ? { ...item, ...patch } : item) }))
                const label = w(isMobile ? 'mobile.apartmentTitle' : 'apartmentTitle', { number: a.number.trim() || index + 1 })
                return <Card key={a.id} component="article" aria-label={label} variant="outlined" sx={theme => ({
                  borderRadius: 1, minWidth: 0,
                  backgroundColor: theme.palette.mode === 'dark' ? lighten(theme.palette.background.paper, 0.16) : theme.palette.background.paper,
                  backgroundImage: 'none',
                })}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <ApartmentIcon fontSize="small" color="action" />
                      <Typography variant="subtitle2" sx={{ overflowWrap: 'anywhere', minWidth: 0 }}>{label}</Typography>
                    </Box>
                    <Tooltip title={w('removeApartment', { number: a.number.trim() || index + 1 })}>
                      <IconButton size="small" color="error" aria-label={w('removeApartment', { number: a.number.trim() || index + 1 })}
                        disabled={busy || Boolean(retryRequest)}
                        onClick={() => updateGroup(g.id, value => ({ ...value, apartments: value.apartments.filter(item => item.id !== a.id) }))}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box sx={{ p: 1.5, display: 'grid', gap: 1.5, alignItems: 'start',
                    gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' },
                    '& .MuiTextField-root': { minWidth: 0 },
                  }}>
                    <ApartmentSetupFields value={a} onChange={update} compactLabels={isMobile} />
                  </Box>
                  <Box sx={{ px: 2, py: 0.75, borderTop: '1px solid', borderColor: 'divider' }}>
                    <FormControlLabel label={w('boiler')} labelPlacement="start"
                      sx={{ m: 0, width: '100%', justifyContent: 'space-between', gap: 2, '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                      control={<Switch size="small" checked={a.hasBoiler} disabled={busy || Boolean(retryRequest)} onChange={e => update({ hasBoiler: e.target.checked })} />} />
                  </Box>
                </Card>
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
              <AccordionDetails sx={{ pt: 0 }}>
                <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, minWidth: 0 }}>
                  {g.apartments.map(a => <Box component="li" key={a.id} sx={{
                    display: 'grid', gridTemplateColumns: { xs: 'repeat(6, minmax(0, 1fr))', sm: 'repeat(5, minmax(0, 1fr))' },
                    columnGap: 1, rowGap: 0.5, py: 1.25, borderBottom: '1px solid', borderColor: 'divider',
                    '&:last-child': { borderBottom: 0 },
                    '& > span': { gridColumn: { xs: 'span 2', sm: 'span 1' }, minWidth: 0, fontSize: '0.8125rem', lineHeight: 1.5, overflowWrap: 'anywhere' },
                    '& > span:nth-of-type(n+4)': { gridColumn: { xs: 'span 3', sm: 'span 1' } },
                  }}>
                    <Box component="span" sx={{ fontWeight: 600 }}>{w('mobile.apartmentTitle', { number: a.number })}</Box>
                    <span>{w('mobile.floor')}: {a.floor || '-'}</span>
                    <span>{a.usableSqm ? `${Number(a.usableSqm).toLocaleString(i18n.resolvedLanguage ?? i18n.language, { maximumFractionDigits: 2 })} m²` : '-'}</span>
                    <span>{translateApartmentSetupStatus(t, a.setupStatus)}</span>
                    <span>{w('mobile.boiler')}: {w(a.hasBoiler ? 'yes' : 'no')}</span>
                  </Box>)}
                </Box>
              </AccordionDetails>
            </Accordion>)}
          </>}
        </Box>
      </>}
    </AppDialog>
    <ConfirmationDialog open={Boolean(confirmation)} title={w('discardTitle')} cancelLabel={t('common.cancel')} confirmLabel={w('discard')}
      onCancel={() => setConfirmation(null)} onConfirm={() => { confirmation?.(); setConfirmation(null) }}><Typography>{w('discardMessage')}</Typography></ConfirmationDialog>
    <Snackbar open={copyNotice !== null} autoHideDuration={3000} onClose={() => setCopyNotice(null)}>
      <Alert severity="success" onClose={() => setCopyNotice(null)}>{w('generationCopied', { staircase: copyNotice })}</Alert>
    </Snackbar>
  </>
}
