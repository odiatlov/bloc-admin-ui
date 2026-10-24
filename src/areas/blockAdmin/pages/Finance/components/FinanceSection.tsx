import type { ReactNode } from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const FinanceSection = ({ title, children, compact = false }: { title: string; children: ReactNode; compact?: boolean }) => (
  <Accordion disableGutters variant={compact ? 'outlined' : 'elevation'} elevation={compact ? 0 : 1} sx={{ minWidth: 0, borderRadius: 1, ...(compact && { backgroundImage: 'none', borderColor: 'divider' }), '&:before': { display: 'none' } }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: compact ? 1.5 : 2, minHeight: compact ? 40 : 56, '& .MuiAccordionSummary-content': { minWidth: 0 } }}>
      <Typography component="span" variant={compact ? 'subtitle2' : 'h6'} sx={{ overflowWrap: 'anywhere', fontWeight: 700 }}>{title}</Typography>
    </AccordionSummary>
    <AccordionDetails sx={{ p: compact ? 1.5 : 2, pt: 0, display: 'grid', gap: 2, minWidth: 0 }}>
      {children}
    </AccordionDetails>
  </Accordion>
)

export default FinanceSection
