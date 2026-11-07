import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { maintenanceReport } from '../../../../../../tests/financeFixtures'
import { renderWithProviders } from '../../../../../../tests/render'
import type { MaintenanceReport } from '../../../../../types/finance'
import FinanceCorrectionComparison from './FinanceCorrectionComparison'
import { ReportSheets } from './MaintenanceReportViewer'

const apartmentA = '00000000-0000-0000-0000-000000000011'
const apartmentB = '00000000-0000-0000-0000-000000000012'
const corrected: MaintenanceReport = { ...maintenanceReport,
  correctsPublicationId: '00000000-0000-0000-0000-000000000060', correctionReason: 'Supplier correction',
  correctionComparison: [
    { apartmentId: apartmentB, number: '1', before: 200, after: 230, difference: 30 },
    { apartmentId: apartmentA, number: '1', before: 100, after: 90, difference: -10 },
  ],
  sheets: ['A', 'B'].map((name, index) => ({ ...maintenanceReport.sheets[0], name,
    staircaseId: `00000000-0000-0000-0000-00000000007${index}`,
    rows: [{ ...maintenanceReport.sheets[0].rows[0], apartmentId: index ? apartmentB : apartmentA,
      number: '1', contactName: index ? 'Contact B' : 'Contact A' }] })),
}
const renderComparison = (language: 'en' | 'ro' = 'en', mode: 'light' | 'dark' = 'light', report = corrected) =>
  renderWithProviders(<MemoryRouter><FinanceCorrectionComparison report={report} /></MemoryRouter>, { language, mode })

beforeEach(() => {
  sessionStorage.clear()
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
})
afterEach(() => vi.unstubAllGlobals())

describe('published correction comparison', () => {
  it.each([['en', 'light'], ['en', 'dark'], ['ro', 'light'], ['ro', 'dark']] as const)(
    'groups status, title and reason in a collapsed section in %s/%s', async (language, mode) => {
      const user = userEvent.setup()
      renderComparison(language, mode)
      const title = language === 'ro' ? 'Diferențe față de publicarea anterioară' : 'Changes from the previous publication'
      const status = language === 'ro' ? 'Ciornă' : 'Draft'
      const expand = screen.getByRole('button', { name: `${language === 'ro' ? 'Extinde' : 'Expand'} ${title}` })
      expect(expand).toHaveAttribute('aria-expanded', 'false')
      const section = expand.closest('.MuiAccordion-root') as HTMLElement
      expect(within(section).getByText(title)).toBeVisible()
      expect(within(section).getByText(status)).toBeVisible()
      expect(within(section).getByText(/Supplier correction/)).toBeVisible()
      await user.click(expand)
      expect(expand).toHaveAttribute('aria-expanded', 'true')
      await user.click(expand)
      expect(expand).toHaveAttribute('aria-expanded', 'false')
    })

  it('uses saved apartment identities to show each staircase and contact, grouped in sheet order', async () => {
    const user = userEvent.setup()
    renderComparison()
    await user.click(screen.getByRole('button', { name: 'Expand Changes from the previous publication' }))
    const table = screen.getByRole('table', { name: 'Changes from the previous publication', hidden: true })
    const rows = within(table).getAllByRole('row', { hidden: true }).slice(1)
    expect(rows).toHaveLength(2)
    expect(within(rows[0]).getByText('Stair A')).toBeInTheDocument()
    expect(within(rows[0]).getByText('Contact A')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Stair B')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Contact B')).toBeInTheDocument()
    expect(within(rows[0]).getByText('1')).toBeInTheDocument()
    expect(within(rows[1]).getByText('1')).toBeInTheDocument()
    for (const heading of ['Previously published amount', 'Corrected amount', 'Difference'])
      expect(within(table).getByRole('columnheader', { name: heading, hidden: true })).toHaveClass('MuiTableCell-alignRight')
    expect(within(rows[1]).getByText(/\+.*30/)).toBeInTheDocument()
    expect(screen.getByText('Previously published total').parentElement).toHaveTextContent(/300/)
    expect(screen.getByText('Corrected total').parentElement).toHaveTextContent(/320/)
    expect(screen.getByText('Total difference').parentElement).toHaveTextContent(/\+.*20/)
  })

  it('uses the block label when there are no staircases and keeps an empty contact explicit', () => {
    renderComparison('en', 'light', { ...corrected, sheets: [{ ...corrected.sheets[0], staircaseId: null,
      name: 'Fixture block', rows: [{ ...corrected.sheets[0].rows[0], contactName: '' }] }],
      correctionComparison: [corrected.correctionComparison![1]] })
    const table = screen.getByRole('table', { hidden: true })
    expect(within(table).getByText('Fixture block')).toBeInTheDocument()
    expect(within(table).getByText('—')).toBeInTheDocument()
  })

  it('keeps the report status inside the correction section without a second loose badge', () => {
    const rendered = renderWithProviders(<MemoryRouter><ReportSheets report={corrected} onPublished={vi.fn()} /></MemoryRouter>)
    const badges = screen.getAllByText('Draft')
    expect(badges).toHaveLength(1)
    expect(rendered.container.querySelector('.MuiAccordion-root')).toContainElement(badges[0])
  })

  it('omits the comparison section for a report that is not a correction', () => {
    renderComparison('en', 'light', maintenanceReport)
    expect(screen.queryByText('Changes from the previous publication')).not.toBeInTheDocument()
  })
})
