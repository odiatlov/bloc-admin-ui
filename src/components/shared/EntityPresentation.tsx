import React from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

export type EntityMetadataItem = {
  key: string
  label: string
  value: React.ReactNode
}

type MetadataLabelProps = {
  children: React.ReactNode
}

export const metadataLabelSx = {
  color: 'text.secondary',
  fontSize: '0.75rem',
  fontWeight: 600,
  lineHeight: 1.35,
}

export const MetadataLabel: React.FC<MetadataLabelProps> = ({ children }) => (
  <Typography component="dt" sx={metadataLabelSx}>
    {children}
  </Typography>
)

type MetadataGridProps = {
  items: EntityMetadataItem[]
}

export const MetadataGrid: React.FC<MetadataGridProps> = ({ items }) => {
  if (items.length === 0) return null

  return (
    <Box
      component="dl"
      sx={{
        m: 0,
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' },
        gap: 1,
        alignItems: 'start',
      }}
    >
      {items.map((item) => (
        <Box key={item.key} sx={{ minWidth: 0 }}>
          <MetadataLabel>{item.label}</MetadataLabel>
          <Box
            component="dd"
            sx={{
              m: 0,
              minWidth: 0,
              color: 'text.primary',
              fontSize: '0.875rem',
              lineHeight: 1.45,
              overflowWrap: 'anywhere',
            }}
          >
            {item.value}
          </Box>
        </Box>
      ))}
    </Box>
  )
}

type EntityListItemProps = {
  actions?: React.ReactNode
  metadata?: EntityMetadataItem[]
  secondary?: React.ReactNode
  status?: React.ReactNode
  title: React.ReactNode
}

export const EntityListItem: React.FC<EntityListItemProps> = ({ actions, metadata = [], secondary, status, title }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 1.25,
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) auto' },
      gap: 1.25,
      alignItems: 'center',
    }}
  >
    <Box sx={{ display: 'grid', gap: 0.75, minWidth: 0 }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
          {title}
        </Typography>
        {status}
      </Box>
      {secondary && (
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45 }}>
          {secondary}
        </Typography>
      )}
      <MetadataGrid items={metadata} />
    </Box>
    {actions && (
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          justifyContent: { xs: 'flex-start', sm: 'flex-end' },
          flexWrap: 'wrap',
        }}
      >
        {actions}
      </Box>
    )}
  </Paper>
)
