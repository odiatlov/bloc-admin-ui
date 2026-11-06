import React from 'react'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import MetricCard from '../../../../../components/shared/MetricCard'

export { default as ActionBar } from '../../../../../components/shared/ActionBar'

type DashboardHeaderProps = {
  title: string
  description?: string
  context?: string
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ context, description, title }) => (
  <Box sx={{ display: 'grid', gap: 0.5 }}>
    <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' }, lineHeight: 1.16 }}>
      {title}
    </Typography>
    {(description || context) && (
      <Typography variant="body1" color="text.secondary">
        {description || context}
      </Typography>
    )}
    {description && context && (
      <Typography variant="caption" color="text.secondary">
        {context}
      </Typography>
    )}
  </Box>
)

type StatCardProps = {
  label: string
  value?: React.ReactNode
  secondary?: React.ReactNode
  badge?: React.ReactNode
  children?: React.ReactNode
}

export const StatCard: React.FC<StatCardProps> = ({ badge, children, label, secondary, value }) => (
  <MetricCard badge={badge} label={label} secondary={secondary} value={value}>
    {children}
  </MetricCard>
)

type StatGridProps = {
  children: React.ReactNode
  columns?: { xs?: string; sm?: string; md?: string; lg?: string }
}

export const StatGrid: React.FC<StatGridProps> = ({ children, columns }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: columns ?? { xs: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
      gridAutoRows: '1fr',
      gap: 2,
    }}
  >
    {children}
  </Box>
)

type ContentCardProps = {
  title: string
  children: React.ReactNode
  accent?: 'warning'
}

export const ContentCard: React.FC<ContentCardProps> = ({ accent, children, title }) => (
  <Paper
    sx={{
      p: 2.25,
      height: '100%',
      boxSizing: 'border-box',
      border: accent ? '1px solid' : undefined,
      borderColor: accent === 'warning' ? 'warning.main' : undefined,
      borderLeftWidth: accent ? 4 : undefined,
    }}
  >
    <Typography variant="h6" sx={{ mb: 1.5 }}>
      {title}
    </Typography>
    {children}
  </Paper>
)

type DashboardActivityListProps = {
  items: readonly { id: string; title: string; secondary?: string; occurredAt?: string }[]
  emptyText: string
}

export const DashboardActivityList: React.FC<DashboardActivityListProps> = ({ items, emptyText }) => {
  const { i18n } = useTranslation()
  const timestamp = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium', timeStyle: 'short', hourCycle: 'h23', timeZone: 'Europe/Bucharest',
  })
  return <List>
    {items.length ? items.map(item => (
      <React.Fragment key={item.id}>
        <ListItem alignItems="flex-start">
          <ListItemText primary={item.title} secondary={item.occurredAt ? timestamp.format(new Date(item.occurredAt)) : item.secondary} />
        </ListItem>
        <Divider component="li" />
      </React.Fragment>
    )) : <ListItem><ListItemText primary={emptyText} /></ListItem>}
  </List>
}

export const DashboardPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ display: 'grid', gap: 2 }}>
    {children}
  </Box>
)
