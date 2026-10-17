import { Accordion, AccordionDetails, Box, FormControlLabel, Switch, TextField, Typography } from '@mui/material'
import ApartmentIcon from '@mui/icons-material/Apartment'
import DeleteIcon from '@mui/icons-material/Delete'
import { lighten } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import ActionButtons from '../shared/ActionButtons'
import ApartmentSetupFields from '../apartments/ApartmentSetupFields'
import ResidentSetupFields from './ResidentSetupFields'
import SetupAccordionHeader from './SetupAccordionHeader'
import type { ResidentResponse } from '../../types/management'
import type { ApartmentDraft, ApartmentValidationErrors, FloorDraft } from './setupDraft'

type Props = {
  apartment: ApartmentDraft
  fallbackNumber: number
  floors: FloorDraft[]
  compactLabels: boolean
  disabled: boolean
  errors: ApartmentValidationErrors
  residents: ResidentResponse[]
  residentsLoading: boolean
  residentsError: boolean
  onRetryResidents: () => void
  onChange: (patch: Partial<ApartmentDraft>) => void
  onExpandedChange: (expanded: boolean) => void
  onRemove: () => void
  onEntered: () => void
}

export default function SetupApartmentCard({ apartment: a, fallbackNumber, floors, compactLabels, disabled, errors, residents, residentsLoading, residentsError, onRetryResidents, onChange, onExpandedChange, onRemove, onEntered }: Props) {
  const { t } = useTranslation()
  const number = a.number.trim() || fallbackNumber
  const label = t(compactLabels ? 'blockSetup.mobile.apartmentTitle' : 'blockSetup.apartmentTitle', { number })
  const id = `setup-apartment-${a.id}`
  const switchSx = { m: 0, width: '100%', minWidth: 0, justifyContent: 'space-between', gap: 1.5,
    '& .MuiFormControlLabel-label': { typography: 'body2', minWidth: 0, overflowWrap: 'anywhere' },
    '& .MuiSwitch-root': { flexShrink: 0 },
  }
  return <Accordion component="article" id={id} aria-label={label} data-setup-apartment disableGutters variant="outlined" disabled={disabled}
    expanded={Boolean(a.expanded)} onChange={(_event, expanded) => onExpandedChange(expanded)}
    slotProps={{ transition: { unmountOnExit: true, onEntered } }} sx={theme => ({
      borderRadius: 1, minWidth: 0, backgroundColor: theme.palette.mode === 'dark' ? lighten(theme.palette.background.paper, 0.16) : theme.palette.background.paper,
      backgroundImage: 'none', '&::before': { display: 'none' },
    })}>
    <SetupAccordionHeader id={`${id}-header`} aria-controls={`${id}-details`} toggleId={`${id}-toggle`}
      sectionLabel={label} expanded={Boolean(a.expanded)} disabled={disabled} onExpandedChange={onExpandedChange}
      actions={<ActionButtons variant="row" actions={[{ id: 'delete', label: t('blockSetup.removeApartment', { number }),
        icon: <DeleteIcon fontSize="small" />, color: 'error', disabled, onClick: onRemove }]} />}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <ApartmentIcon fontSize="small" color="action" />
        <Typography variant="subtitle2" color={Object.keys(errors).length ? 'error' : undefined} sx={{ overflowWrap: 'anywhere', minWidth: 0 }}>{label}</Typography>
      </Box>
    </SetupAccordionHeader>
    <AccordionDetails id={`${id}-content`} sx={{ p: 0, minWidth: 0 }}>
      <Box sx={{ p: 1.5, display: 'grid', gap: 1.5, alignItems: 'start', borderTop: '1px solid', borderColor: 'divider',
        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' },
        '& .MuiTextField-root': { minWidth: 0 },
      }}>
        <ApartmentSetupFields value={a} onChange={onChange} compactLabels={compactLabels} errors={errors} disabled={disabled}
          floorChoices={floors.map(floor => ({ value: String(floor.level), label: t('blockSetup.floorLabel', { floor: floor.level }) }))} />
        <TextField fullWidth required size="small" type="number" label={t('apartments.setup.householdMembers')} value={a.addResident ? a.householdCount : '0'}
          disabled={!a.addResident || disabled} error={Boolean(errors.householdCount)}
          helperText={errors.householdCount || (!a.addResident ? t('apartments.setup.assignOwnerBeforeCount') : undefined)}
          slotProps={{ htmlInput: { min: 0, max: 2147483647, step: 1 } }} onChange={event => onChange({ householdCount: event.target.value })}
          sx={{ gridColumn: { xs: '1 / -1', sm: 'span 2' } }} />
      </Box>
      <Box sx={{ px: 2, py: 0.75, borderTop: '1px solid', borderColor: 'divider', display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }, columnGap: 3, rowGap: 0.5 }}>
        <FormControlLabel label={t('blockSetup.boiler')} labelPlacement="start" sx={switchSx}
          control={<Switch size="small" checked={a.hasBoiler} disabled={disabled} onChange={event => onChange({ hasBoiler: event.target.checked })} />} />
        <FormControlLabel label={t('blockSetup.addResident')} labelPlacement="start" sx={switchSx}
          control={<Switch size="small" checked={a.addResident} disabled={disabled} onChange={event => onChange({ addResident: event.target.checked, ...(!event.target.checked ? { householdCount: '0' } : {}) })} />} />
      </Box>
      {a.addResident && <ResidentSetupFields value={a.resident} onChange={patch => onChange({ resident: { ...a.resident, ...patch } })}
        errors={errors} residents={residents} loading={residentsLoading} error={residentsError} onRetry={onRetryResidents} disabled={disabled} />}
    </AccordionDetails>
  </Accordion>
}
