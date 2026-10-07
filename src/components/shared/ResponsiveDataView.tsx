import React from 'react'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Pagination from '@mui/material/Pagination'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useTranslation } from 'react-i18next'
import { EntityListItem, type EntityMetadataItem, metadataLabelSx } from './EntityPresentation'
import ActionButtons, { type ActionButtonDefinition } from './ActionButtons'
import IconButtonTooltip from './IconButtonTooltip'
import { DataViewPaginationContext } from './DataViewPaginationProvider'
import { DATA_VIEW_PAGE_SIZE, getDataViewPage, resolveDataViewPage, type DataViewPageState } from '../../utils/dataViewPagination'

export type DataColumn<T> = {
  key: string
  label: string
  cardRole?: CardRole
} & (
  | { render: (row: T) => React.ReactNode; actions?: never }
  | { actions: (row: T) => ActionButtonDefinition[]; render?: never }
)

type CardRole = 'primary' | 'secondary' | 'metadata' | 'status' | 'actions' | 'hidden'

export type ResponsiveDataViewProps<T> = {
  ariaLabel: string
  columns: DataColumn<T>[]
  desktopTableMinWidth?: number
  emptyState?: React.ReactNode
  getRowId: (row: T) => string
  paginationId: string
  paginationResetKey?: string
  serverPagination?: { page: number; totalCount: number; loading?: boolean; onPageChange: (page: number) => void }
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

const ResponsiveDataView = <T,>({ ariaLabel, columns, desktopTableMinWidth = 900, emptyState, getRowId, paginationId, paginationResetKey = '', serverPagination, renderCardCornerActions, rows }: ResponsiveDataViewProps<T>) => {
  const { t } = useTranslation()
  const store = React.useContext(DataViewPaginationContext)
  const [localState, setLocalState] = React.useState<DataViewPageState>()
  const savedState = store ? store.pages.get(paginationId) : localState
  const resolved = resolveDataViewPage(savedState, paginationResetKey, rows.length)
  const page = serverPagination?.page ?? resolved.page
  const resetKey = resolved.resetKey
  const totalCount = serverPagination?.totalCount ?? rows.length
  const rememberPage = store?.rememberPage
  const viewRef = React.useRef<HTMLDivElement>(null)
  const totalPages = Math.max(1, Math.ceil(totalCount / DATA_VIEW_PAGE_SIZE))
  const pageRows = serverPagination ? rows : getDataViewPage(rows, page)

  React.useEffect(() => {
    if (rememberPage && !serverPagination) rememberPage(paginationId, { page, resetKey })
  }, [rememberPage, paginationId, page, resetKey, serverPagination])

  const changePage = (nextPage: number) => {
    const state = { page: nextPage, resetKey }
    if (serverPagination) serverPagination.onPageChange(nextPage)
    else if (rememberPage) rememberPage(paginationId, state)
    else setLocalState(state)
    if (viewRef.current && viewRef.current.getBoundingClientRect().top < 0) {
      viewRef.current.scrollIntoView({ block: 'start', behavior: 'auto' })
    }
  }

  if (rows.length === 0 && emptyState) return <>{emptyState}</>
  const actionColumns = columns.filter((column) => column.actions)
  const firstActionColumn = actionColumns[0]

  return (
    <Box
      ref={viewRef}
      sx={{
        containerType: 'inline-size',
        scrollMarginTop: '80px',
        '.ResponsiveDataView-numberedPagination': { display: 'none' },
        '.ResponsiveDataView-compactPagination': { display: 'flex' },
        '@container (min-width: 640px)': {
          '.ResponsiveDataView-numberedPagination': { display: 'block' },
          '.ResponsiveDataView-compactPagination': { display: 'none' },
        },
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
            {pageRows.map((row) => {
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
        {pageRows.map((row) => {
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
      {rows.length > 0 && totalPages > 1 && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, py: 1.5 }}>
          <Typography variant="body2" color="text.secondary" role="status" aria-atomic="true">
            {t('common.pagination.range', { from: (page - 1) * DATA_VIEW_PAGE_SIZE + 1, to: Math.min(page * DATA_VIEW_PAGE_SIZE, totalCount), total: totalCount })}
          </Typography>
          <Box className="ResponsiveDataView-numberedPagination">
            <Pagination
              disabled={serverPagination?.loading}
              aria-label={t('common.pagination.navigation', { list: ariaLabel })}
              count={totalPages}
              page={page}
              onChange={(_, nextPage) => changePage(nextPage)}
              color="primary"
              siblingCount={1}
              boundaryCount={1}
              getItemAriaLabel={(type, itemPage) => type === 'page'
                ? t('common.pagination.goToPage', { page: itemPage })
                : t(`common.pagination.${type}`)}
              sx={{ '& .MuiPaginationItem-root': { minWidth: 40, height: 40 } }}
            />
          </Box>
          <Box component="nav" className="ResponsiveDataView-compactPagination" aria-label={t('common.pagination.navigation', { list: ariaLabel })} sx={{ alignItems: 'center', gap: 0.5 }}>
            <IconButtonTooltip title={t('common.pagination.previous')}>
              <IconButton aria-label={t('common.pagination.previous')} disabled={page === 1 || serverPagination?.loading} onClick={() => changePage(page - 1)} sx={{ width: 44, height: 44 }}>
                <ChevronLeftIcon />
              </IconButton>
            </IconButtonTooltip>
            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>{t('common.pagination.page', { page, total: totalPages })}</Typography>
            <IconButtonTooltip title={t('common.pagination.next')}>
              <IconButton aria-label={t('common.pagination.next')} disabled={page === totalPages || serverPagination?.loading} onClick={() => changePage(page + 1)} sx={{ width: 44, height: 44 }}>
                <ChevronRightIcon />
              </IconButton>
            </IconButtonTooltip>
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default ResponsiveDataView
