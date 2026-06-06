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

export type DataColumn<T> = {
  key: string
  label: string
  render: (row: T) => React.ReactNode
  cardRole?: CardRole
}

type CardRole = 'primary' | 'secondary' | 'metadata' | 'status' | 'actions' | 'hidden'

type ResponsiveDataViewProps<T> = {
  ariaLabel: string
  columns: DataColumn<T>[]
  desktopTableMinWidth?: number
  emptyState?: React.ReactNode
  getRowId: (row: T) => string
  rows: T[]
}

const inferCardRole = (column: Pick<DataColumn<unknown>, 'cardRole' | 'key'>, index: number): CardRole => {
  if (column.cardRole) return column.cardRole
  if (column.key === 'actions') return 'actions'
  if (column.key.toLowerCase().includes('status') || column.key.toLowerCase().includes('state') || column.key.toLowerCase().includes('anomaly')) return 'status'
  if (index === 0) return 'primary'
  return 'metadata'
}

const ResponsiveDataView = <T,>({ ariaLabel, columns, desktopTableMinWidth = 900, emptyState, getRowId, rows }: ResponsiveDataViewProps<T>) => {
  if (rows.length === 0 && emptyState) return <>{emptyState}</>

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
        <Table size="small" aria-label={ariaLabel}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.key} sx={metadataLabelSx}>{column.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={getRowId(row)} hover>
                {columns.map((column) => (
                  <TableCell key={column.key}>{column.render(row)}</TableCell>
                ))}
              </TableRow>
            ))}
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
          let actions: React.ReactNode = null
          const metadata: EntityMetadataItem[] = []

          columns.forEach((column, index) => {
            const value = column.render(row)
            const role = inferCardRole(column, index)

            if (role === 'hidden') return
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
            if (role === 'actions') actions = actions ? <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}{value}</Box> : value
            if (role === 'metadata') metadata.push({ key: column.key, label: column.label, value })
          })

          return (
            <EntityListItem
              key={getRowId(row)}
              actions={actions}
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
