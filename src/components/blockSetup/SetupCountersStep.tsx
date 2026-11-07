import { Accordion, AccordionDetails, Alert, Box, Button, IconButton, MenuItem, TextField, Typography } from '@mui/material'
import { darken, lighten, useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import ApartmentIcon from '@mui/icons-material/Apartment'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useTranslation } from 'react-i18next'
import IconButtonTooltip from '../shared/IconButtonTooltip'
import WaterMeterZoneFields from '../water/WaterMeterZoneFields'
import SetupAccordionHeader from './SetupAccordionHeader'
import SetupFloorSection from './SetupFloorSection'
import { newCounterZoneSelection, type Group } from './setupDraft'
import { floorSections } from './setupFloorLayout'
import { groupWaterMeterCount } from './setupMeterDraft'
import { newWaterZone, waterLocationTypes, waterMeterCount, waterZonesError } from '../../domain/waterMeterConfiguration'

export default function SetupCountersStep({ groups, hasStaircases, blockName, disabled, showErrors, onUpdate, onGenerate, onCopy, onEntered, onFocusRequest }: {
  groups: Group[]; hasStaircases: boolean; blockName: string; disabled: boolean; showErrors: boolean
  onUpdate: (id: string, update: (group: Group) => Group, clearError?: boolean) => void
  onGenerate: (group: Group) => void; onCopy: (group: Group) => void; onEntered: () => void
  onFocusRequest: (target: { id: string; selector?: string }) => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const w = (key: string, values?: Record<string, unknown>) => t(`blockSetup.${key}`, values)
  return <>{groups.map(group => {
    const location = hasStaircases ? group.name : blockName
    const generationLabel = w('generateCountersForLocation', { location })
    return <Accordion key={group.id} disableGutters expanded={group.expanded !== false} disabled={disabled}
      onChange={(_event, expanded) => onUpdate(group.id, value => ({ ...value, expanded }), false)}
      slotProps={{ transition: { onEntered } }} sx={{ backgroundImage: 'none', minWidth: 0,
        backgroundColor: theme.palette.mode === 'dark' ? lighten(theme.palette.background.paper, 0.06) : darken(theme.palette.background.default, 0.04) }}>
      <SetupAccordionHeader id={`counter-header-${group.id}`} aria-controls={`counter-content-${group.id}`} toggleId={`counter-toggle-${group.id}`}
        sectionLabel={location} expanded={group.expanded !== false} disabled={disabled}
        onExpandedChange={expanded => onUpdate(group.id, value => ({ ...value, expanded }), false)}
        actions={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {isMobile ? <IconButtonTooltip title={generationLabel}><IconButton size="small" color="primary" aria-label={generationLabel} disabled={disabled}
          onClick={event => { event.stopPropagation(); onGenerate(group) }} sx={{ width: 32, height: 32 }}><AutoAwesomeIcon fontSize="small" /></IconButton></IconButtonTooltip>
          : <Button size="small" variant="outlined" startIcon={<AutoAwesomeIcon fontSize="small" />} aria-label={generationLabel} disabled={disabled}
            onClick={event => { event.stopPropagation(); onGenerate(group) }} sx={{ width: 112, minHeight: 32, px: 1 }}>{w('generate')}</Button>}
          {hasStaircases && <IconButtonTooltip title={w('copyCounterGeneration')}><span>
            <IconButton size="small" color="primary" aria-label={w('copyCounterGeneration')} disabled={disabled || groups.length < 2}
              onClick={event => { event.stopPropagation(); onCopy(group) }} sx={{ width: 32, height: 32 }}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </span></IconButtonTooltip>}
        </Box>}>
        <Box sx={{ minWidth: 0 }}><Typography sx={{ overflowWrap: 'anywhere' }}>{location}</Typography>
          <Typography variant="caption" color="text.secondary">{w('apartmentsCount', { count: group.apartments.length })} · {w('floorsCount', { count: group.floors.length })} · {w('metersCount', { count: groupWaterMeterCount(group) })}</Typography></Box>
      </SetupAccordionHeader>
      <AccordionDetails id={`counter-content-${group.id}`} sx={{ display: 'grid', gap: 2, px: { xs: 1, sm: 2 }, minWidth: 0 }}>
        <Box component="section" aria-label={w('counterGeneration')} id={`counter-generation-${group.id}`} sx={{ display: 'grid', gap: 1 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'start', gap: 1 }}>
            {group.counterGeneration.map((selection, index) => <Box key={selection.id} sx={{ display: 'flex', gap: 0.5, flex: '1 1 180px', maxWidth: 260, minWidth: 0 }}>
              <TextField id={`counter-zone-${selection.id}`} select fullWidth required size="small" disabled={disabled} label={w('counterZone', { number: index + 1 })}
                value={selection.locationType} error={showErrors && !selection.locationType}
                onChange={event => onUpdate(group.id, value => ({ ...value, counterGeneration: value.counterGeneration.map(item => item.id === selection.id ? { ...item, locationType: event.target.value } : item) }))}>
                <MenuItem value="" disabled>{w('selectZone')}</MenuItem>
                {waterLocationTypes.map(type => <MenuItem key={type} value={type} disabled={group.counterGeneration.some(other => other.id !== selection.id && other.locationType === type)}>{t(`apartments.waterIndex.locations.${type}`)}</MenuItem>)}
              </TextField>
              {group.counterGeneration.length > 1 && <IconButtonTooltip title={w('removeZoneField')}><IconButton size="small" disabled={disabled} aria-label={w('removeZoneField')}
                onClick={() => onUpdate(group.id, value => ({ ...value, counterGeneration: value.counterGeneration.filter(item => item.id !== selection.id) }))}><CloseIcon fontSize="small" /></IconButton></IconButtonTooltip>}
            </Box>)}
            <IconButtonTooltip title={w('addZoneField')}><span><IconButton color="primary" disabled={disabled || group.counterGeneration.length >= waterLocationTypes.length} aria-label={w('addZoneField')}
              onClick={() => {
                const selection = newCounterZoneSelection()
                onFocusRequest({ id: `counter-zone-${selection.id}` })
                onUpdate(group.id, value => ({ ...value, counterGeneration: [...value.counterGeneration, selection] }))
              }} sx={{ border: '1px solid', borderColor: 'primary.main', borderRadius: 1 }}><AddIcon /></IconButton></span></IconButtonTooltip>
          </Box>
          <Typography variant="caption" color="text.secondary">{w('counterGenerationHelp')}</Typography>
        </Box>
        {floorSections(group).map(({ floor, apartments }) => <SetupFloorSection key={floor?.id ?? `${group.id}-unassigned`}
          id={floor ? `counter-floor-${floor.id}` : `counter-unassigned-${group.id}`} floor={floor} apartmentCount={apartments.length} ownerCount={0} occupantCount={0}
          meterCount={apartments.reduce((sum, apartment) => sum + waterMeterCount(apartment.waterZones), 0)}
          expanded={floor ? floor.expanded : group.unassignedExpanded !== false} disabled={disabled} onEntered={onEntered}
          onExpandedChange={expanded => onUpdate(group.id, value => floor
            ? { ...value, floors: value.floors.map(item => item.id === floor.id ? { ...item, expanded } : item) }
            : { ...value, unassignedExpanded: expanded }, false)}>
          {apartments.map(apartment => {
            const label = w('apartmentTitle', { number: apartment.number })
            const id = `counter-apartment-${apartment.id}`
            const error = showErrors ? waterZonesError(apartment.waterZones, apartment.hasBoiler) : null
            return <Accordion key={apartment.id} component="article" id={id} aria-label={label} disableGutters variant="outlined" disabled={disabled}
              expanded={Boolean(apartment.expanded)} onChange={(_event, expanded) => onUpdate(group.id, value => ({ ...value, apartments: value.apartments.map(item => item.id === apartment.id ? { ...item, expanded } : item) }), false)}
              slotProps={{ transition: { unmountOnExit: true, onEntered } }} sx={{ borderRadius: 1, minWidth: 0, backgroundImage: 'none',
                backgroundColor: theme.palette.mode === 'dark' ? lighten(theme.palette.background.paper, 0.16) : theme.palette.background.paper, '&::before': { display: 'none' } }}>
              <SetupAccordionHeader id={`${id}-header`} aria-controls={`${id}-content`} toggleId={`${id}-toggle`} sectionLabel={label} expanded={Boolean(apartment.expanded)} disabled={disabled}
                onExpandedChange={expanded => onUpdate(group.id, value => ({ ...value, apartments: value.apartments.map(item => item.id === apartment.id ? { ...item, expanded } : item) }), false)}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}><ApartmentIcon fontSize="small" color="action" />
                  <Box sx={{ minWidth: 0 }}><Typography variant="subtitle2" color={error ? 'error' : undefined} sx={{ overflowWrap: 'anywhere' }}>{label}</Typography>
                    <Typography variant="caption" color="text.secondary">{w('metersCount', { count: waterMeterCount(apartment.waterZones) })}</Typography></Box></Box>
              </SetupAccordionHeader>
              <AccordionDetails id={`${id}-content`} sx={{ display: 'grid', gap: 1.5, p: 1.5, minWidth: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                {apartment.hasBoiler && <Typography variant="caption" color="text.secondary">{w('boilerCountersHelp')}</Typography>}
                {error && <Alert severity="error">{w(error)}</Alert>}
                {!apartment.waterZones.length && <Typography variant="body2" color="text.secondary">{t('apartments.waterIndex.empty')}</Typography>}
                {apartment.waterZones.map(zone => <WaterMeterZoneFields key={zone.id} zone={zone} hasBoiler={apartment.hasBoiler} disabled={disabled} showErrors={showErrors}
                  onChange={patch => onUpdate(group.id, value => ({ ...value, apartments: value.apartments.map(item => item.id === apartment.id
                    ? { ...item, waterZones: item.waterZones.map(current => current.id === zone.id ? { ...current, ...patch, ...(item.hasBoiler ? { hotWaterCount: 0 } : {}) } : current) } : item) }))}
                  onRemove={() => onUpdate(group.id, value => ({ ...value, apartments: value.apartments.map(item => item.id === apartment.id ? { ...item, waterZones: item.waterZones.filter(current => current.id !== zone.id) } : item) }))} />)}
                <Button startIcon={<AddIcon />} disabled={disabled} onClick={() => {
                  const type = waterLocationTypes.find(locationType => !apartment.waterZones.some(zone => zone.locationType === locationType)) ?? 'Other'
                  const zone = newWaterZone(type, t(`apartments.waterIndex.locations.${type}`), apartment.hasBoiler)
                  onUpdate(group.id, value => ({ ...value, apartments: value.apartments.map(item => item.id === apartment.id ? { ...item, waterZones: [...item.waterZones, zone] } : item) }))
                }}>{t('apartments.waterIndex.addZone')}</Button>
              </AccordionDetails>
            </Accordion>
          })}
        </SetupFloorSection>)}
      </AccordionDetails>
    </Accordion>
  })}</>
}
