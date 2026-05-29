import React from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'

export type DataColumn<T> = {
  key: string
  label: string
  render: (row: T) => React.ReactNode
}

type ResponsiveDataViewProps<T> = {
  ariaLabel: string
  columns: DataColumn<T>[]
  desktopTableMinWidth?: number
  emptyState?: React.ReactNode
  getRowId: (row: T) => string
  rows: T[]
}

const ResponsiveDataView = <T,>({ ariaLabel, columns, desktopTableMinWidth = 900, emptyState, getRowId, rows }: ResponsiveDataViewProps<T>) => {
  if (rows.length === 0 && emptyState) return <>{emptyState}</>

  return (
    <Box
      sx={{
        containerType: 'inline-size',
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
          overflowX: 'hidden',
        }}
      >
        <Table size="small" aria-label={ariaLabel}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.key}>{column.label}</TableCell>
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
        }}
      >
        {rows.map((row) => (
          <Card key={getRowId(row)}>
            <CardContent sx={{ display: 'grid', gap: 1 }}>
              {columns.map((column) => (
                <Box key={column.key}>
                  <Typography variant="caption" color="text.secondary">
                    {column.label}
                  </Typography>
                  <Box>{column.render(row)}</Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  )
}

export default ResponsiveDataView
