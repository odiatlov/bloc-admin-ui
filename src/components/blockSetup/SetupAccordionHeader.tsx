import type { ReactNode } from 'react'
import { AccordionSummary, Box, IconButton } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useTranslation } from 'react-i18next'
import IconButtonTooltip from '../shared/IconButtonTooltip'

type Props = {
  id: string
  'aria-controls': string
  toggleId: string
  sectionLabel: string
  expanded: boolean
  disabled: boolean
  onExpandedChange: (expanded: boolean) => void
  actions: ReactNode
  children: ReactNode
}

export default function SetupAccordionHeader({ id, 'aria-controls': contentId, toggleId, sectionLabel, expanded, disabled, onExpandedChange, actions, children }: Props) {
  const { t } = useTranslation()
  const toggleLabel = t(expanded ? 'blockSetup.collapseSection' : 'blockSetup.expandSection', { section: sectionLabel })
  return <Box id={id} aria-controls={contentId} sx={{ display: 'grid', minWidth: 0, alignItems: 'start',
    gridTemplateColumns: 'minmax(0, 1fr) auto auto',
  }}>
    <AccordionSummary id={toggleId} aria-controls={contentId} sx={{ minWidth: 0, px: 1.5, gridRow: 1,
      gridColumn: 1, '& .MuiAccordionSummary-content': { minWidth: 0 },
    }}>{children}</AccordionSummary>
    <Box sx={{ minWidth: 0, p: 1, gridColumn: 2, gridRow: 1 }}>{actions}</Box>
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', pr: 0.5, pt: 1, gridColumn: 3, gridRow: 1 }}>
      <IconButtonTooltip title={toggleLabel}>
        <IconButton size="small" aria-label={toggleLabel} aria-expanded={expanded} aria-controls={contentId} disabled={disabled} sx={{ width: 32, height: 32 }}
          onClick={event => { event.stopPropagation(); onExpandedChange(!expanded) }}>
          <ExpandMoreIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />
        </IconButton>
      </IconButtonTooltip>
    </Box>
  </Box>
}
