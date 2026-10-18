import type { ReactNode } from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const FinanceSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <Accordion disableGutters elevation={1} sx={{ minWidth: 0, borderRadius: 1, '&:before': { display: 'none' } }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2, minHeight: 56, '& .MuiAccordionSummary-content': { minWidth: 0 } }}>
      <Typography component="span" variant="h6" sx={{ overflowWrap: 'anywhere' }}>{title}</Typography>
    </AccordionSummary>
    <AccordionDetails sx={{ p: 2, pt: 0, display: 'grid', gap: 2, minWidth: 0 }}>
      {children}
    </AccordionDetails>
  </Accordion>
)

export default FinanceSection
