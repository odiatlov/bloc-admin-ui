import { useId, useState, type ReactNode } from 'react'
import { Accordion, AccordionDetails, Box, Typography } from '@mui/material'
import AccordionSectionHeader from '../../../../../components/shared/AccordionSectionHeader'

type Props = { title: string; description?: ReactNode; children: ReactNode; compact?: boolean; variant?: 'outlined' | 'elevation'; actions?: ReactNode; defaultExpanded?: boolean }

const FinanceSection = ({ title, description, children, compact = false, variant = compact ? 'outlined' : 'elevation', actions, defaultExpanded = false }: Props) => {
  const id = useId()
  const [expanded, setExpanded] = useState(defaultExpanded)
  return <Accordion disableGutters expanded={expanded} onChange={(_, next) => setExpanded(next)}
    variant={variant} elevation={variant === 'outlined' ? 0 : 1}
    sx={{ minWidth: 0, borderRadius: 1, ...(variant === 'outlined' && { backgroundImage: 'none', borderColor: 'divider' }), '&:before': { display: 'none' } }}>
    <AccordionSectionHeader id={id + '-header'} aria-controls={id + '-content'} toggleId={id + '-toggle'}
      sectionLabel={title} expanded={expanded} onExpandedChange={setExpanded} actions={actions}>
      <Box sx={{ display: 'grid', gap: 0.5, minWidth: 0 }}>
        <Typography component="span" variant={compact ? 'subtitle2' : 'h6'} sx={{ overflowWrap: 'anywhere', fontWeight: 700 }}>{title}</Typography>
        {description && <Typography component="span" variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{description}</Typography>}
      </Box>
    </AccordionSectionHeader>
    <AccordionDetails id={id + '-content'} sx={{ p: compact ? 1.5 : 2, pt: 2, display: 'grid', gap: 2, minWidth: 0 }}>
      {children}
    </AccordionDetails>
  </Accordion>
}

export default FinanceSection
