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
        columnGap: 2,
        rowGap: 1.25,
        alignItems: 'start',
        maxWidth: '100%',
        overflow: 'hidden',
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

type EntityActionGroupProps = {
  children: React.ReactNode
}

export const EntityActionGroup: React.FC<EntityActionGroupProps> = ({ children }) => (
  <Box
    sx={(theme) => ({
      display: 'grid',
      gap: 1,
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
      maxWidth: '100%',
      minWidth: 0,
      width: '100%',
      '& .MuiButton-root': {
        justifyContent: 'center',
        minHeight: 40,
        minWidth: 0,
        width: '100%',
      },
      '& > .MuiBox-root': {
        display: 'grid',
        gap: 1,
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
        width: '100%',
      },
      '& .MuiButton-text': {
        boxShadow: 1,
        border: 1,
        px: 1.5,
      },
      '& .MuiButton-text.MuiButton-colorPrimary': {
        borderColor: theme.palette.mode === 'dark' ? '#6366F1' : '#4F46E5',
        bgcolor: theme.palette.mode === 'dark' ? '#6366F1' : '#4F46E5',
        color: 'primary.contrastText',
        '&:hover': {
          bgcolor: theme.palette.mode === 'dark' ? '#4F46E5' : '#4338CA',
        },
      },
      '& .MuiButton-text.MuiButton-colorError, & .MuiButton-outlined.MuiButton-colorError': {
        borderColor: 'error.main',
        bgcolor: 'transparent',
        color: 'error.main',
        '&:hover': {
          bgcolor: 'transparent',
        },
      },
      '& .MuiButton-text.Mui-disabled': {
        boxShadow: 'none',
        borderColor: 'action.disabledBackground',
        bgcolor: 'action.disabledBackground',
      },
    })}
  >
    {children}
  </Box>
)

type EntityCardFooterProps = {
  children: React.ReactNode
}

export const EntityCardFooter: React.FC<EntityCardFooterProps> = ({ children }) => (
  <Box
    sx={{
      gridColumn: '1 / -1',
      maxWidth: '100%',
      minWidth: 0,
      px: 1.25,
      pb: 1.25,
      pt: 0.25,
      width: '100%',
    }}
  >
    <EntityActionGroup>{children}</EntityActionGroup>
  </Box>
)

export const EntityListItem: React.FC<EntityListItemProps> = ({ actions, metadata = [], secondary, secondaryLabel, status, statusLabel, title, titleLabel }) => (
  <Paper
    variant="outlined"
    sx={{
      bgcolor: actions ? 'action.hover' : 'background.paper',
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: 0,
      alignItems: 'center',
      maxWidth: '100%',
      overflow: 'hidden',
    }}
  >
    <Box sx={{ display: 'grid', gap: 1, minWidth: 0, maxWidth: '100%', overflow: 'hidden', p: 1.5 }}>
      <Box sx={{ alignItems: 'start', display: 'grid', gap: 1, gridTemplateColumns: 'minmax(0, 1fr) auto', minWidth: 0, maxWidth: '100%' }}>
        <Box sx={{ minWidth: 0 }}>
          {titleLabel && <MetadataLabel>{titleLabel}</MetadataLabel>}
          <Typography variant="body1" sx={{ minWidth: 0, fontWeight: 700, lineHeight: 1.35, overflowWrap: 'anywhere' }}>
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
      <EntityCardFooter>
        {actions}
      </EntityCardFooter>
    )}
  </Paper>
)
