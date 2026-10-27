import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../tests/render'
import { usePagedList } from '../../hooks/usePagedList'
import PagedResponsiveDataView from './PagedResponsiveDataView'

vi.mock('../../hooks/usePagedList', () => ({ usePagedList: vi.fn() }))

const useList = vi.mocked(usePagedList)
type PageState = ReturnType<typeof usePagedList>

function setup(overrides: Partial<PageState> = {}) {
  const state: PageState = {
    data: undefined, loading: false, error: undefined,
    refresh: vi.fn(), setPage: vi.fn(), ...overrides,
  }
  useList.mockReturnValue(state)
  renderWithProviders(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><PagedResponsiveDataView<{ id: string; name: string }>
    endpoint="/test-residents" paginationId="unit-test-residents" ariaLabel="Residents overview" rows={[]}
    columns={[{ key: 'name', label: 'Resident name', render: (row) => row.name }]} getRowId={(row) => row.id}
    emptyState={<p>No residents found</p>}
  /></MemoryRouter>)
  return state
}

const populatedPage = {
  items: [{ id: 'ae1bef06-2762-40ed-842f-2ccdf4ac6b3c', name: 'Ana Popescu' }],
  totalCount: 1, pageNumber: 1, pageSize: 10,
} satisfies NonNullable<PageState['data']>

describe('PagedResponsiveDataView', () => {
  beforeEach(() => {
    useList.mockReset()
    sessionStorage.clear()
  })

  it('shows initial loading independently from an empty response', () => {
    setup({ loading: true })
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i)
    expect(screen.queryByText('No residents found')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('table', { hidden: true })).not.toBeInTheDocument()
  })

  it('shows errors and retries instead of presenting an empty successful response', async () => {
    const user = userEvent.setup()
    const { refresh } = setup({ error: 'Request failed' })
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.queryByText('No residents found')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('shows the provided empty state for a successful response with zero records', () => {
    setup({ data: { ...populatedPage, items: [], totalCount: 0 } })
    expect(screen.getByText('No residents found')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('table', { hidden: true })).not.toBeInTheDocument()
  })

  it('renders populated API records in the actual shared table', () => {
    setup({ data: populatedPage })
    // jsdom does not evaluate container-query layouts. Check rendered table
    // content without claiming to verify which responsive branch is visible.
    const table = screen.getByRole('table', { hidden: true })
    expect(within(table).getByRole('columnheader', { hidden: true })).toHaveTextContent('Resident name')
    expect(within(table).getByRole('cell', { hidden: true })).toHaveTextContent('Ana Popescu')
    expect(screen.queryByText('No residents found')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('retains existing records and indicates when a refresh is pending', () => {
    setup({ data: populatedPage, loading: true })
    const table = screen.getByRole('table', { hidden: true })
    expect(within(table).getByRole('cell', { hidden: true })).toHaveTextContent('Ana Popescu')
    expect(screen.getByRole('progressbar', { name: /loading/i })).toBeInTheDocument()
    expect(screen.queryByText('No residents found')).not.toBeInTheDocument()
  })
})
