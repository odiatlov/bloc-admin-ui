import React from 'react'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import { EntityListItem, type EntityMetadataItem, metadataLabelSx } from './EntityPresentation'
import ActionButtons, { type ActionButtonDefinition } from './ActionButtons'

export type DataColumn<T> = {
  key: string
  label: string
  cardRole?: CardRole
} & (
  | { render: (row: T) => React.ReactNode; actions?: never }
  | { actions: (row: T) => ActionButtonDefinition[]; render?: never }
)

type CardRole = 'primary' | 'secondary' | 'metadata' | 'status' | 'actions' | 'hidden'

type ResponsiveDataViewProps<T> = {
  ariaLabel: string
  columns: DataColumn<T>[]
  desktopTableMinWidth?: number
  emptyState?: React.ReactNode
  getRowId: (row: T) => string
  renderCardCornerActions?: (row: T) => React.ReactNode
  rows: T[]
}

const inferCardRole = (column: Pick<DataColumn<unknown>, 'cardRole' | 'key'>, index: number): CardRole => {
  if (column.cardRole) return column.cardRole
  if (column.key === 'actions') return 'actions'
  if (column.key.toLowerCase().includes('status') || column.key.toLowerCase().includes('state') || column.key.toLowerCase().includes('anomaly')) return 'status'
  if (index === 0) return 'primary'
  return 'metadata'
}

const ResponsiveDataView = <T,>({ ariaLabel, columns, desktopTableMinWidth = 900, emptyState, getRowId, renderCardCornerActions, rows }: ResponsiveDataViewProps<T>) => {
  if (rows.length === 0 && emptyState) return <>{emptyState}</>
  const actionColumns = columns.filter((column) => column.actions)
  const firstActionColumn = actionColumns[0]

  return (
    <Box
      sx={{
        containerType: 'inline-size',
        maxWidth: '100%',
        overflowX: 'hidden',
        '.ResponsiveDataView-table': {
          display: 'none',
        },
        '.ResponsiveDataView-cards': {
          display: 'grid',
        },
        [`@container (min-width: ${desktopTableMinWidth}px)`]: {
          '.ResponsiveDataView-table': {
            display: 'block',
          },
          '.ResponsiveDataView-cards': {
            display: 'none',
          },
        },
      }}
    >
      <TableContainer
        className="ResponsiveDataView-table"
        component={Paper}
        sx={{
          maxWidth: '100%',
          overflowX: 'hidden',
        }}
      >
        <Table size="small" aria-label={ariaLabel} sx={{ width: '100%' }}>
          <colgroup>
            {columns.map((column, index) => (
              <col
                key={column.key}
                style={inferCardRole(column, index) === 'actions' ? { width: '144px' } : undefined}
              />
            ))}
          </colgroup>
          <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <TableCell
                  key={column.key}
                  sx={{
                    ...metadataLabelSx,
                    whiteSpace: inferCardRole(column, index) === 'actions' ? 'nowrap' : undefined,
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const actions = actionColumns.flatMap((column) => column.actions!(row))
              return (
                <TableRow key={getRowId(row)} hover>
                {columns.map((column) => {
                  return (
                    <TableCell key={column.key}>
                      {column.actions
                        ? column === firstActionColumn && <ActionButtons actions={actions} variant="row" />
                        : column.render(row)}
                    </TableCell>
                  )
                })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        className="ResponsiveDataView-cards"
        sx={{
          gap: 1.5,
          maxWidth: '100%',
          overflowX: 'hidden',
        }}
      >
        {rows.map((row) => {
          let primary: React.ReactNode = null
          let secondary: React.ReactNode = null
          let secondaryLabel = ''
          let status: React.ReactNode = null
          const actions = actionColumns.flatMap((column) => column.actions!(row))
          const metadata: EntityMetadataItem[] = []

          columns.forEach((column, index) => {
            const role = inferCardRole(column, index)
            if (role === 'hidden' || column.actions) return
            const value = column.render(row)
            if (role === 'primary') {
              primary = value
            }
            if (role === 'secondary') {
              secondary = value
              secondaryLabel = column.label
            }
            if (role === 'status') {
              status = status ? <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>{status}{value}</Box> : value
            }
            if (role === 'metadata') metadata.push({ key: column.key, label: column.label, value })
          })

          return (
            <EntityListItem
              key={getRowId(row)}
              actions={actions.some((action) => action.visible !== false) ? <ActionButtons actions={actions} variant="card" /> : undefined}
              cornerActions={renderCardCornerActions?.(row)}
              metadata={metadata}
              secondary={secondary}
              secondaryLabel={secondaryLabel}
              status={status}
              title={primary}
            />
          )
        })}
      </Box>
    </Box>
  )
}

export default ResponsiveDataView
