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
              fontSize: '0.9375rem',
              fontWeight: 500,
              lineHeight: 1.4,
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
  secondaryLabel?: string
  status?: React.ReactNode
  statusLabel?: string
  title: React.ReactNode
  titleLabel?: string
}

export const EntityListItem: React.FC<EntityListItemProps> = ({ actions, metadata = [], secondary, secondaryLabel, status, statusLabel, title, titleLabel }) => (
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
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'start', flexWrap: 'wrap', minWidth: 0 }}>
        <Box sx={{ minWidth: 0 }}>
          {titleLabel && <MetadataLabel>{titleLabel}</MetadataLabel>}
          <Typography variant="body1" sx={{ minWidth: 0, fontWeight: 600, lineHeight: 1.35, overflowWrap: 'anywhere' }}>
            {title}
          </Typography>
        </Box>
        {status && (
          <Box sx={{ minWidth: 0 }}>
            {statusLabel && <MetadataLabel>{statusLabel}</MetadataLabel>}
            <Box sx={{ mt: statusLabel ? 0.25 : 0 }}>{status}</Box>
          </Box>
        )}
      </Box>
      <MetadataGrid
        items={[
          ...(secondary ? [{ key: 'secondary', label: secondaryLabel ?? '', value: secondary }] : []),
          ...metadata,
        ]}
      />
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
