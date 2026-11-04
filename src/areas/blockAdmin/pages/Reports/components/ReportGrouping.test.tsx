import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../../../tests/render'
import { maintenanceReport } from '../../../../../../tests/financeFixtures'
import { ReportSheets } from './MaintenanceReportViewer'

afterEach(() => vi.unstubAllGlobals())
it('groups selected expenses in the report while preserving every saved line in details', async () => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  const user = userEvent.setup()
  const report = { ...maintenanceReport, columns: maintenanceReport.columns.map((column, index) => ({ ...column, includeInMiscellaneous: index >= 3 })) }
  renderWithProviders(<MemoryRouter><ReportSheets report={report} onPublished={vi.fn()} renderActions={() => <span>Actions</span>} /></MemoryRouter>)
  const table = screen.getByRole('table', { hidden: true })
  expect(within(table).getByText('Other expenses')).toBeInTheDocument()
  expect(within(table).queryByText('Garden repair')).not.toBeInTheDocument()
  expect(within(table).getByText('Cold supply')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Calculation details' }))
  expect(screen.getByRole('dialog')).toHaveTextContent('Garden repair')
  expect(screen.getByRole('dialog')).toHaveTextContent('Agreed repair contribution')
})
