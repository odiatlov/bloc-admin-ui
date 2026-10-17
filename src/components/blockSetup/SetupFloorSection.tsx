import type { ReactNode } from 'react'
import { Accordion, AccordionDetails, Box, Button, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { useTranslation } from 'react-i18next'
import ActionButtons from '../shared/ActionButtons'
import SetupAccordionHeader from './SetupAccordionHeader'
import type { FloorDraft } from './setupDraft'

type Props = {
  id: string
  floor: FloorDraft | null
  apartmentCount: number
  expanded: boolean
  disabled: boolean
  onExpandedChange: (expanded: boolean) => void
  onAdd: () => void
  onRemove?: () => void
  onEntered: () => void
  children: ReactNode
}

export default function SetupFloorSection({ id, floor, apartmentCount, expanded, disabled, onExpandedChange, onAdd, onRemove, onEntered, children }: Props) {
  const { t } = useTranslation()
  const floorLabel = floor ? t('blockSetup.floorLabel', { floor: floor.level }) : t('blockSetup.unassignedFloor')
  const label = floor?.level === 0 ? `${floorLabel} (${t('blockSetup.groundFloor')})` : floorLabel
  return <Accordion disableGutters variant="outlined" expanded={expanded} disabled={disabled} onChange={(_event, value) => onExpandedChange(value)}
    slotProps={{ transition: { unmountOnExit: true, onEntered } }} sx={{ minWidth: 0, borderRadius: 1, '&::before': { display: 'none' } }}>
    <SetupAccordionHeader id={`${id}-header`} aria-controls={`${id}-details`} toggleId={`${id}-toggle`}
      sectionLabel={label} expanded={expanded} disabled={disabled} onExpandedChange={onExpandedChange}
      actions={<ActionButtons variant="row" actions={[
          { id: 'delete', label: t('blockSetup.deleteFloor'), icon: <DeleteIcon />, color: 'error',
            alwaysInline: true, visible: Boolean(floor && apartmentCount === 0 && onRemove), disabled, onClick: onRemove },
      ]} />}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ overflowWrap: 'anywhere' }}>{label}</Typography>
        <Typography variant="caption" color="text.secondary">{t('blockSetup.apartmentsCount', { count: apartmentCount })}</Typography>
      </Box>
    </SetupAccordionHeader>
    <AccordionDetails id={`${id}-content`} sx={{ display: 'grid', gap: 1.5, p: { xs: 1, sm: 1.5 }, borderTop: '1px solid', borderColor: 'divider', minWidth: 0 }}>
      {apartmentCount === 0 ? <Typography variant="body2" color="text.secondary">{t('blockSetup.emptyFloor')} {t('blockSetup.deleteFloorHint')}</Typography> : children}
      <Button fullWidth variant="text" startIcon={<AddIcon />} disabled={disabled} onClick={onAdd}
        sx={{ minWidth: 0, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>{t('blockSetup.addApartment')}</Button>
    </AccordionDetails>
  </Accordion>
}
