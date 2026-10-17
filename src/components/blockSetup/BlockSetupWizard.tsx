import React from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Checkbox, FormControlLabel, IconButton, InputAdornment, MenuItem, Radio, RadioGroup, Snackbar, Step, StepLabel, Stepper, TextField, Typography } from '@mui/material'
import ApartmentIcon from '@mui/icons-material/Apartment'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import AddIcon from '@mui/icons-material/Add'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { darken, lighten, useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTranslation } from 'react-i18next'
import AppDialog from '../shared/AppDialog'
import IconButtonTooltip from '../shared/IconButtonTooltip'
import ConfirmationDialog from '../shared/ConfirmationDialog'
import type { BlockSetupRequest, BlockSetupResponse, CreateBlockRequest, SetupApartment } from '../../types/block'
import BlockFields from './BlockFields'
import EmptyState from '../shared/EmptyState'
import { ApiError } from '../../services/apiClient'
import { residentsApi } from '../../services/residentsApi'
import type { ResidentResponse } from '../../types/management'
import SetupApartmentCard from './SetupApartmentCard'
import SetupFloorSection from './SetupFloorSection'
import SetupAccordionHeader from './SetupAccordionHeader'
import { translateApartmentSetupStatus } from '../../domain/displayLabels'
import { primaryContainedButtonColors } from '../../theme/themeConfig'
import { apartmentValidationErrors, generateStaircases, newGroup, unique, type ApartmentDraft, type ApartmentValidationErrors, type ApartmentValidationField, type GenerationSettings, type Group } from './setupDraft'
import { addApartmentToFloor, addFloor, appendApartmentBatch, deleteApartment, deleteEmptyFloor, expandApartment, floorLevel, floorSections, moveApartment, orderedApartments, orderedFloors, type LayoutResult } from './setupFloorLayout'
type DraftNotice = { id: string; key: string; values?: Record<string, unknown>; groupId?: string }
type FocusTarget = { id: string; selector?: string }
const toApartment = (a: ApartmentDraft): SetupApartment => ({ number: a.number.trim(), floor: a.floor.trim() ? Number(a.floor) : null,
  usableSqm: a.usableSqm.trim() ? Number(a.usableSqm) : null, setupStatus: a.setupStatus, hasBoiler: a.hasBoiler,
  householdCount: a.addResident ? Number(a.householdCount) : 0, resident: a.addResident ? {
    residentId: a.resident.mode === 'existing' ? a.resident.residentId : null,
    firstName: a.resident.mode === 'new' ? a.resident.firstName.trim() : '', lastName: a.resident.mode === 'new' ? a.resident.lastName.trim() : '',
    phone: a.resident.mode === 'new' ? a.resident.phone.trim() || null : null,
    email: a.resident.inviteResident ? a.resident.email.trim() : null, inviteResident: a.resident.inviteResident,
  } : null })

export default function BlockSetupWizard({ onClose, onSimple, onSetup, loadResidentOptions = residentsApi.getAll, accountCaption }: {
  onClose: () => void; onSimple: (request: CreateBlockRequest) => Promise<void>; onSetup: (request: BlockSetupRequest) => Promise<BlockSetupResponse>
  loadResidentOptions?: () => Promise<ResidentResponse[]>; accountCaption?: string
}) {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const groupSurfaceSx = {
    backgroundColor: theme.palette.mode === 'dark'
      ? lighten(theme.palette.background.paper, 0.06)
      : darken(theme.palette.background.default, 0.04),
    backgroundImage: 'none',
  }
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
  const [notice, setNotice] = React.useState<DraftNotice | null>(null)
  const [undo, setUndo] = React.useState<Group | null>(null)
  const pendingFocus = React.useRef<FocusTarget | null>(null)
  const [staircaseNaming, setStaircaseNaming] = React.useState<'alphabetical' | 'numeric'>('alphabetical')
  const [staircaseQuantity, setStaircaseQuantity] = React.useState('1')
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const submitting = React.useRef(false)
  const [confirmation, setConfirmation] = React.useState<(() => void) | null>(null)
  const [requestId] = React.useState(() => crypto.randomUUID())
  const [retryRequest, setRetryRequest] = React.useState<BlockSetupRequest | null>(null)
  const [setupSaved, setSetupSaved] = React.useState(false)
  const [failedInvitations, setFailedInvitations] = React.useState<string[]>([])
  const [residents, setResidents] = React.useState<ResidentResponse[]>([])
  const [residentsLoading, setResidentsLoading] = React.useState(true)
  const [residentsError, setResidentsError] = React.useState(false)
  const locked = busy || Boolean(retryRequest) || setupSaved
  const groups = hasStaircases ? staircases : [blockGroup]
  const steps = ['details', ...(hasStaircases ? ['staircases'] : []), 'apartments', 'review']
  const current = steps[stage]
  const goToStage = (nextStage: number) => {
    if (steps[nextStage] === 'apartments' && current !== 'apartments') {
      if (hasStaircases) setStaircases(value => value.map((group, index) => ({ ...group, expanded: index === 0 })))
      else setBlockGroup(value => ({ ...value, expanded: true }))
    }
    setStage(nextStage)
  }
  const focusPending = React.useCallback(() => {
    const target = pendingFocus.current
    if (!target) return
    const container = document.getElementById(target.id)
    const element = target.selector ? container?.querySelector<HTMLElement>(target.selector) : container
    if (!element || !element.getClientRects().length) return
    element.scrollIntoView({ block: 'nearest' })
    element.focus({ preventScroll: true })
    pendingFocus.current = null
  }, [])
  React.useEffect(() => {
    const frame = window.requestAnimationFrame(focusPending)
    return () => window.cancelAnimationFrame(frame)
  }, [staircases, blockGroup, stage, focusPending])
  const loadResidents = React.useCallback(async () => {
    setResidentsLoading(true); setResidentsError(false)
    try { setResidents((await loadResidentOptions()).filter(resident => resident.status === 'active')) }
    catch { setResidents([]); setResidentsError(true) }
    finally { setResidentsLoading(false) }
  }, [loadResidentOptions])
  React.useEffect(() => {
    if (current !== 'apartments') return
    const timeout = window.setTimeout(() => { void loadResidents() }, 0)
    return () => window.clearTimeout(timeout)
  }, [current, loadResidents])
  const populated = Boolean(name || address || staircases.length || blockGroup.apartments.length)
  const ask = (action: () => void, needed = populated) => needed ? setConfirmation(() => action) : action()
  const updateGroup = (id: string, update: (group: Group) => Group, clearError = true, invalidateUndo = clearError) => {
    if (clearError && (locked || submitting.current)) return
    if (hasStaircases) setStaircases(value => value.map(g => g.id === id ? update(g) : g))
    else setBlockGroup(update)
    if (invalidateUndo) setUndo(value => value?.id === id ? null : value)
    if (clearError) setError(null)
  }
  const applyLayout = (group: Group, change: (value: Group) => LayoutResult, key: string, values?: Record<string, unknown>) => {
    if (locked || submitting.current) return null
    const result = change(group)
    if (result.error !== undefined) { setError(w('generationError', { location: hasStaircases ? group.name : name, reason: w(result.error) })); return null }
    const nextGroup = result.group
    if (nextGroup === group) return null
    setUndo(structuredClone(group))
    updateGroup(group.id, () => nextGroup, true, false)
    setNotice({ id: crypto.randomUUID(), key, values, groupId: group.id })
    return nextGroup
  }
  const undoLayout = () => {
    if (!undo || locked || submitting.current || !groups.some(group => group.id === undo.id)) return
    updateGroup(undo.id, () => structuredClone(undo), true, false)
    pendingFocus.current = { id: `setup-toggle-${undo.id}` }
    setUndo(null)
    setNotice({ id: crypto.randomUUID(), key: 'layoutUndone' })
  }
  const dismissNotice = () => { setNotice(null); setUndo(null) }
  const updateGeneration = (group: Group, patch: Partial<GenerationSettings>) => updateGroup(group.id, current => ({ ...current, generation: { ...current.generation, ...patch } }))
  const copyGeneration = (source: Group) => {
    if (locked || submitting.current) return
    setStaircases(current => current.map(group => group.id === source.id ? group : { ...group, generation: { ...source.generation } }))
    setUndo(null)
    setNotice({ id: crypto.randomUUID(), key: 'generationCopied', values: { staircase: source.name } })
  }
  const errorsFor = (group: Group, apartment: ApartmentDraft): ApartmentValidationErrors => {
    const errors = apartmentValidationErrors(apartment)
    if (apartment.floor.trim() && !group.floors.some(floor => floor.level === floorLevel(apartment.floor))) errors.floor = 'floorUnavailable'
    if (apartment.number.trim() && group.apartments.some(other => other.id !== apartment.id && other.number.trim().toLowerCase() === apartment.number.trim().toLowerCase())) errors.number = 'duplicateNumber'
    if (apartment.addResident && apartment.resident.mode === 'existing' && apartment.resident.residentId) {
      if (residentsLoading) errors.residentId = 'residentsLoading'
      else if (residentsError) errors.residentId = 'residentsLoadError'
      else if (!residents.some(resident => resident.id === apartment.resident.residentId)) errors.residentId = 'residentUnavailable'
    }
    return errors
  }
  const fieldLabels: Record<ApartmentValidationField, string> = {
    number: 'apartments.setup.number', floor: 'blocks.columns.floor', usableSqm: 'blocks.columns.usableSurface', setupStatus: 'apartments.setup.setupStatus',
    householdCount: 'apartments.setup.householdMembers', residentId: 'blockSetup.existingResident', firstName: 'residents.fields.firstName',
    lastName: 'residents.fields.lastName', phone: 'residents.fields.phone', email: 'residents.fields.email',
  }
  const reportValidationError = (step: string) => {
    if (step !== 'apartments') { setError(w('validation')); return }
    for (const group of groups) {
      const location = hasStaircases ? t('settings.fields.staircaseName', { staircase: group.name }) : t('common.blockValue', { block: name })
      if (group.apartments.length === 0) { setError(w('emptyLocation', { location })); return }
      for (const [index, apartment] of orderedApartments(group).entries()) {
        const issue = Object.entries(errorsFor(group, apartment))[0]
        if (!issue) continue
        const [field, reason] = issue
        pendingFocus.current = { id: `setup-apartment-${apartment.id}`, selector: 'input[aria-invalid="true"], [role="combobox"][aria-invalid="true"]' }
        updateGroup(group.id, value => expandApartment(value, apartment.id), false)
        setError(w('apartmentValidation', { location, number: apartment.number.trim() || index + 1,
          field: t(fieldLabels[field as ApartmentValidationField]), reason: w(`validationErrors.${reason}`) }))
        return
      }
    }
    setError(w('validation'))
  }
  const validate = (step: string) => {
    if (step === 'details') return Boolean(name.trim())
    if (step === 'staircases') return staircases.length > 0 && staircases.every(g => Boolean(g.name.trim()) && g.name.trim().length <= 100) && unique(staircases.map(g => g.name))
    if (step === 'apartments') return groups.length > 0 && groups.every(g => g.apartments.length > 0 && g.apartments.every(a => Object.keys(errorsFor(g, a)).length === 0))
    return true
  }
  const batch = () => {
    const result = generateStaircases(staircaseNaming, Number(staircaseQuantity), staircases.map(g => g.name))
    if (result.error) { setError(w(result.error)); return }
    setStaircases(value => [...value, ...result.values.map(newGroup)])
    setError(null)
  }
  const generateApartments = (group: Group) => {
    applyLayout(group, value => {
      const result = appendApartmentBatch(value)
      return result.error !== undefined ? result : { group: { ...result.group, expanded: true } }
    }, 'apartmentsGenerated')
  }
  const submit = async () => {
    if (submitting.current) return
    if (!name.trim()) { setError(w('validation')); return }
    if (mode === 'full' && !retryRequest && !validate('apartments')) {
      goToStage(steps.indexOf('apartments')); reportValidationError('apartments'); return
    }
    if (mode === 'full' && !retryRequest && hasStaircases && !validate('staircases')) { reportValidationError('staircases'); return }
    submitting.current = true; setBusy(true); setError(null); setUndo(null); setNotice(null); pendingFocus.current = null
    try {
      if (mode === 'simple') await onSimple({ name: name.trim(), address: address.trim() || undefined, hasStaircases: false, apartmentCount: 0, residentCount: 0, staircaseCount: 0 })
      else {
        const request = retryRequest ?? { requestId, name: name.trim(), address: address.trim(), hasStaircases,
          staircases: hasStaircases ? staircases.map(g => ({ name: g.name.trim(), apartments: orderedApartments(g).map(toApartment) })) : [],
          apartments: hasStaircases ? [] : orderedApartments(blockGroup).map(toApartment) }
        setRetryRequest(request)
        const result = await onSetup(request)
        setSetupSaved(true)
        setFailedInvitations(result.invitations.filter(invitation => !invitation.succeeded).map(invitation => invitation.email))
      }
    } catch (e) {
      if (!setupSaved && e instanceof ApiError && e.status >= 400 && e.status < 500) setRetryRequest(null)
      setError(e instanceof Error ? e.message : t('settings.blockDialog.serverError'))
    }
    finally { submitting.current = false; setBusy(false) }
  }
  const next = () => {
    setError(null)
    if (stage === -1) { goToStage(0); return }
    if (!validate(current)) { reportValidationError(current); return }
    if (mode === 'simple' || current === 'review') void submit()
    else goToStage(stage + 1)
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
        slotProps={{
          htmlInput: { min: -2147483648, max: 2147483647, step: 1,
            'aria-valuetext': floorLevel(group.generation.startingFloor) === 0 ? `0 (${w('groundFloor')})` : undefined },
          input: { endAdornment: floorLevel(group.generation.startingFloor) === 0 ? <InputAdornment position="end" sx={{ ml: 0.5, maxWidth: '60%' }}>
            <Typography variant="caption" sx={{ whiteSpace: 'normal', lineHeight: 1.2 }}>({w('groundFloor')})</Typography>
          </InputAdornment> : undefined },
        }} />
      <TextField required size="small" type="number" label={caption('floorCount')} value={group.generation.floorCount} onChange={e => updateGeneration(group, { floorCount: e.target.value })}
        slotProps={{ htmlInput: { min: 1, max: 1000, step: 1 } }} />
      <TextField size="small" type="number" label={isMobile ? w('mobile.usableSqm') : t('blocks.columns.usableSurface')} value={group.generation.usableSqm} onChange={e => updateGeneration(group, { usableSqm: e.target.value })}
        slotProps={{ htmlInput: { min: 0, step: 0.01 } }} sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }} />
    </>}
    {!group && <Button variant="outlined" startIcon={<AutoAwesomeIcon />} onClick={batch} sx={{ gridColumn: { xs: '1 / -1', md: 'auto' }, minHeight: 40 }}>{w('generate')}</Button>}
  </Box>
  const removeButton = (action: () => void) => <IconButtonTooltip title={w('remove')}><IconButton aria-label={w('remove')} onClick={action}><DeleteIcon /></IconButton></IconButtonTooltip>
  return <>
    <AppDialog open title={w(stage === -1 ? 'chooseTitle' : 'title')} maxWidth="md"
      onCancel={() => { if (!busy) ask(onClose, !setupSaved && populated) }} cancelLabel={t('common.cancel')}
      hideCancelButton showCloseButton closeLabel={t('common.close')} closeDisabled={busy}
      onBack={stage >= 0 ? () => { setError(null); goToStage(stage - 1) } : undefined}
      backLabel={w('back')} backDisabled={busy || Boolean(retryRequest)}
      onConfirm={next} confirmDisabled={busy} confirmLabel={busy ? t('settings.blockDialog.saving') : setupSaved ? w('retryInvitations') : stage === -1 ? w('continue') : mode === 'simple' || current === 'review' ? w('create') : w('next')}
      confirmButtonSx={{ '&:not(.Mui-disabled):hover': { backgroundColor: primaryContainedButtonColors[theme.palette.mode].background } }}
      dialogContentSx={{ pt: '4px !important', px: { xs: 2, sm: 3 } }}
      contentSx={{ display: 'grid', gap: 2, pt: 0 }}>
      {accountCaption && <Typography color="text.secondary">{accountCaption}</Typography>}
      {error && <Alert severity="error" onClose={() => setError(null)} closeText={t('common.close')}
        sx={{ '& .MuiAlert-action': { alignItems: 'flex-start', pt: 0 } }}>{error}</Alert>}
      {retryRequest && !setupSaved && <Alert severity="info">{w('retry')}</Alert>}
      {failedInvitations.length > 0 && <Alert severity="warning" sx={{ overflowWrap: 'anywhere' }}>{w('invitationFailed', { emails: failedInvitations.join(', ') })}</Alert>}
      {stage === -1 ? <RadioGroup value={mode} onChange={e => {
        const selected = e.target.value as 'simple' | 'full'
        ask(() => { setMode(selected); setName(''); setAddress(''); setStaircases([]); setBlockGroup(newGroup()); dismissNotice() })
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
        <Box component="fieldset" disabled={locked} sx={{ border: 0, p: 0, m: 0, minWidth: 0, display: 'grid', gap: 2 }}>
          {current === 'details' && <>
            <BlockFields name={name} address={address} onChange={(field, value) => field === 'name' ? setName(value) : setAddress(value)} />
            {mode === 'full' && <FormControlLabel label={w('hasStaircases')} control={<Checkbox checked={hasStaircases} onChange={e => {
              const checked = e.target.checked
              ask(() => { setHasStaircases(checked); setStaircases([]); setBlockGroup(newGroup()); dismissNotice() }, staircases.length > 0 || blockGroup.apartments.length > 0 || blockGroup.floors.length > 0)
            }} />} />}
          </>}
          {current === 'staircases' && <>
            {batchControls()}
            {staircases.map(g => <Box key={g.id} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField required fullWidth label={w('staircaseName')} value={g.name} onChange={e => updateGroup(g.id, value => ({ ...value, name: e.target.value }))} />
              {removeButton(() => ask(() => { setStaircases(value => value.filter(s => s.id !== g.id)); if (undo?.id === g.id) dismissNotice() }, g.apartments.length > 0))}
            </Box>)}
            <Button startIcon={<AddIcon />} onClick={() => setStaircases(value => [...value, newGroup()])}>{w('addStaircase')}</Button>
          </>}
          {current === 'apartments' && groups.map(g => <Accordion key={g.id} expanded={g.expanded !== false} disableGutters sx={groupSurfaceSx}
            onChange={(_event, expanded) => updateGroup(g.id, value => ({ ...value, expanded }), false)}
            slotProps={{ transition: { onEntered: focusPending } }}>
            <SetupAccordionHeader id={`setup-header-${g.id}`} aria-controls={`setup-apartments-${g.id}`} toggleId={`setup-toggle-${g.id}`}
              sectionLabel={hasStaircases ? g.name : name} expanded={g.expanded !== false} disabled={locked}
              onExpandedChange={expanded => updateGroup(g.id, value => ({ ...value, expanded }), false)}
              actions={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {isMobile ? <IconButtonTooltip title={hasStaircases ? w('generateStaircase', { staircase: g.name }) : w('generate')}>
                <IconButton size="small" color="primary" aria-label={hasStaircases ? w('generateStaircase', { staircase: g.name }) : w('generate')}
                  disabled={locked} sx={{ width: 32, height: 32 }}
                  onClick={event => { event.stopPropagation(); generateApartments(g) }}>
                  <AutoAwesomeIcon fontSize="small" />
                </IconButton>
              </IconButtonTooltip> : <Button size="small" variant="outlined" startIcon={<AutoAwesomeIcon fontSize="small" />} aria-label={hasStaircases ? w('generateStaircase', { staircase: g.name }) : w('generate')}
                disabled={locked} sx={{ width: 112, minHeight: 32, px: 1 }}
                onClick={event => { event.stopPropagation(); generateApartments(g) }}>
                {w('generate')}
              </Button>}
              {hasStaircases && <IconButtonTooltip title={w('copyGeneration')}>
                <span>
                  <IconButton size="small" aria-label={w('copyGeneration')} color="primary" disabled={locked || staircases.length < 2} sx={{ width: 32, height: 32 }}
                    onClick={event => { event.stopPropagation(); copyGeneration(g) }}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </span>
              </IconButtonTooltip>}
              </Box>}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ overflowWrap: 'anywhere' }}>{hasStaircases ? g.name : name}</Typography>
                <Typography variant="caption" color="text.secondary">{w('apartmentsCount', { count: g.apartments.length })} · {w('floorsCount', { count: g.floors.length })}</Typography>
              </Box>
            </SetupAccordionHeader>
            <AccordionDetails id={`setup-apartments-content-${g.id}`} sx={{ display: 'grid', gap: 2, px: { xs: 1, sm: 2 }, minWidth: 0 }}>
              {batchControls(g)}
              {g.floors.length === 0 && g.apartments.length === 0 && <EmptyState inline headline={w('noFloors')} helperText={w('addFloorHint')} />}
              {floorSections(g).map(({ floor, apartments }) => <SetupFloorSection key={floor?.id ?? `${g.id}-unassigned`}
                id={floor ? `setup-floor-${floor.id}` : `setup-unassigned-${g.id}`} floor={floor} apartmentCount={apartments.length}
                expanded={floor ? floor.expanded : g.unassignedExpanded !== false} disabled={locked} onEntered={focusPending}
                onExpandedChange={expanded => updateGroup(g.id, value => floor
                  ? { ...value, floors: value.floors.map(item => item.id === floor.id ? { ...item, expanded } : item) }
                  : { ...value, unassignedExpanded: expanded }, false)}
                onAdd={() => {
                  const nextGroup = applyLayout(g, value => addApartmentToFloor(value, floor?.level ?? null), 'apartmentAdded')
                  const existingIds = new Set(g.apartments.map(apartment => apartment.id))
                  const added = nextGroup?.apartments.find(apartment => !existingIds.has(apartment.id))
                  if (added) pendingFocus.current = { id: `setup-apartment-${added.id}-toggle` }
                }}
                onRemove={floor ? () => {
                  const nextGroup = applyLayout(g, value => deleteEmptyFloor(value, floor.id), 'floorRemoved', { floor: floor.level })
                  if (nextGroup) pendingFocus.current = { id: `setup-toggle-${g.id}` }
                } : undefined}>
                {apartments.map(a => <SetupApartmentCard key={a.id} apartment={a} fallbackNumber={g.apartments.indexOf(a) + 1}
                  floors={orderedFloors(g)} compactLabels={isMobile} disabled={locked} onEntered={focusPending}
                  errors={error ? Object.fromEntries(Object.entries(errorsFor(g, a)).map(([field, reason]) => [field, w(`validationErrors.${reason}`)])) : {}}
                  residents={residents} residentsLoading={residentsLoading} residentsError={residentsError} onRetryResidents={() => { void loadResidents() }}
                  onExpandedChange={expanded => updateGroup(g.id, value => ({ ...value, apartments: value.apartments.map(item => item.id === a.id ? { ...item, expanded } : item) }), false)}
                  onChange={patch => {
                    if (patch.floor !== undefined) {
                      const nextGroup = applyLayout(g, value => moveApartment(value, a.id, patch.floor!), 'apartmentMoved', { number: a.number })
                      if (nextGroup) pendingFocus.current = { id: `setup-apartment-${a.id}`, selector: '[data-setup-floor-choice] [role="combobox"]' }
                    } else updateGroup(g.id, value => ({ ...value, apartments: value.apartments.map(item => item.id === a.id ? { ...item, ...patch } : item) }))
                  }}
                  onRemove={() => {
                    const nextGroup = applyLayout(g, value => deleteApartment(value, a.id), 'apartmentRemoved', { number: a.number })
                    if (nextGroup) pendingFocus.current = { id: floor ? `setup-floor-${floor.id}-toggle` : `setup-toggle-${g.id}` }
                  }} />)}
              </SetupFloorSection>)}
              <Button id={`setup-add-floor-${g.id}`} variant="outlined" startIcon={<AddIcon />} disabled={locked} onClick={() => {
                const nextGroup = applyLayout(g, addFloor, 'floorAdded')
                const added = nextGroup?.floors.find(floor => !g.floors.some(existing => existing.id === floor.id))
                if (added) pendingFocus.current = { id: `setup-floor-${added.id}-toggle` }
              }}>{w('addFloor')}</Button>
            </AccordionDetails>
          </Accordion>)}
          {current === 'review' && <>
            <Typography variant="h6" sx={{ overflowWrap: 'anywhere' }}>{name}</Typography>
            {address && <Typography sx={{ overflowWrap: 'anywhere' }}>{address}</Typography>}
            <Typography>{w('totals', { staircases: hasStaircases ? staircases.length : 0, apartments: groups.reduce((sum, g) => sum + g.apartments.length, 0),
              occupants: groups.reduce((sum, g) => sum + g.apartments.reduce((total, a) => total + (a.addResident ? Number(a.householdCount) : 0), 0), 0),
              residents: new Set(groups.flatMap(g => g.apartments.filter(a => a.addResident).map(a => a.resident.mode === 'existing' ? a.resident.residentId : a.resident.inviteResident ? a.resident.email.trim().toLowerCase() : a.id))).size,
            })}</Typography>
            {groups.map(g => <Accordion key={g.id} disableGutters sx={groupSurfaceSx}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography sx={{ overflowWrap: 'anywhere' }}>{hasStaircases ? g.name : name} ({g.apartments.length})</Typography></AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                {floorSections(g).map(({ floor, apartments }) => <Box key={floor?.id ?? `${g.id}-unassigned`} sx={{ minWidth: 0, pt: 1.5 }}>
                  <Typography variant="subtitle2">{floor ? w('floorLabel', { floor: floor.level }) : w('unassignedFloor')} · {w('apartmentsCount', { count: apartments.length })}</Typography>
                  {apartments.length === 0 && <Typography variant="body2" color="text.secondary">{w('emptyFloor')}</Typography>}
                  <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, minWidth: 0 }}>
                  {apartments.map(a => <Box component="li" key={a.id} sx={{
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
                    <span>{t('apartments.setup.householdMembers')}: {a.addResident ? a.householdCount : '0'}</span>
                    {a.addResident && <span>{w('owner')}: {a.resident.mode === 'existing' ? residents.find(resident => resident.id === a.resident.residentId)?.fullName : `${a.resident.firstName} ${a.resident.lastName}`}</span>}
                    {a.addResident && a.resident.inviteResident && <span>{t('residents.fields.inviteResident')}: {a.resident.email}</span>}
                  </Box>)}
                  </Box>
                </Box>)}
              </AccordionDetails>
            </Accordion>)}
          </>}
        </Box>
      </>}
      <Snackbar key={notice?.id ?? 'closed'} open={notice !== null} autoHideDuration={6000} onClose={(_event, reason) => { if (reason !== 'clickaway') dismissNotice() }}>
        <Alert severity="success" onClose={dismissNotice} closeText={t('common.close')}
          action={undo && notice?.groupId === undo.id ? <Button size="small" color="inherit" disabled={locked} onClick={undoLayout}>{w('undo')}</Button> : undefined}
          sx={{ minWidth: 0, '& .MuiAlert-message': { overflowWrap: 'anywhere' } }}>
          {notice ? w(notice.key, notice.values) : ''}
        </Alert>
      </Snackbar>
    </AppDialog>
    <ConfirmationDialog open={Boolean(confirmation)} title={w('discardTitle')} cancelLabel={t('common.cancel')} confirmLabel={w('discard')}
      onCancel={() => setConfirmation(null)} onConfirm={() => { confirmation?.(); setConfirmation(null) }}><Typography>{w('discardMessage')}</Typography></ConfirmationDialog>
  </>
}
