import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { usePagedList, type ListQuery } from '../../hooks/usePagedList'
import ResponsiveDataView, { type ResponsiveDataViewProps } from './ResponsiveDataView'
import LoadErrorState from './LoadErrorState'
import EmptyState from './EmptyState'

type Props<T, TResponse = T> = Omit<ResponsiveDataViewProps<T>, 'serverPagination'> & {
  endpoint: string
  query?: ListQuery
  mapRow?: (row: TResponse) => T
}

const PagedResponsiveDataView = <T, TResponse = T,>({ endpoint, query = {}, mapRow, rows, ...props }: Props<T, TResponse>) => {
  const { t } = useTranslation()
  // Parent collections still feed selectors, summaries and exports; their refresh also invalidates this page.
  const page = usePagedList<TResponse>(props.paginationId, endpoint, query, JSON.stringify(rows))
  if (page.loading && !page.data) return <Box role="status" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 4 }}>
    <CircularProgress size={24} />
    <Typography color="text.secondary">{t('common.pagination.loading')}</Typography>
  </Box>
  if (page.error) return <LoadErrorState onRetry={page.refresh} />
  if (!page.data?.totalCount) return props.emptyState ?? <EmptyState headline={t('common.pagination.empty')} helperText={t('common.pagination.emptyHelper')} />
  const items = page.data.items.map((row) => mapRow ? mapRow(row) : row as unknown as T)
  return <Box aria-busy={page.loading} sx={{ position: 'relative' }}>
    {page.loading && <LinearProgress aria-label={t('common.pagination.loading')} sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}
    <ResponsiveDataView {...props} rows={items} serverPagination={{ page: page.data.pageNumber, totalCount: page.data.totalCount, loading: page.loading, onPageChange: page.setPage }} />
  </Box>
}

export default PagedResponsiveDataView
