import Chip from '@mui/material/Chip'

export default function AssociationBadge({ label }: { label: string }) {
  return <Chip label={label} size="small" variant="filled"
    sx={{ maxWidth: '100%', height: 'auto', minHeight: 24,
      '& .MuiChip-label': { whiteSpace: 'normal', overflowWrap: 'anywhere', py: 0.25 } }} />
}
