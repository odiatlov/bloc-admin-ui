import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: React.ReactNode
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: { xs: 'stretch', sm: 'flex-start' }, flexDirection: { xs: 'column', sm: 'row' }, mb: 2 }}>
    <Box>
      <Typography variant="h4" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      )}
    </Box>
    {actions && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box>}
  </Box>
)

export default PageHeader
