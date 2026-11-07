import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../../../tests/render'
import { financeWorkspace, maintenanceReport, residentContext } from '../../../../../../tests/financeFixtures'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { financeApi } from '../../../../../services/financeApi'
import type { FinancePublication, MaintenanceReport } from '../../../../../types/finance'
import MaintenanceReportActions from './MaintenanceReportActions'
import { ReportSheets } from './MaintenanceReportViewer'

// The shared picker has its own behavior; these tests focus on publication validation and request lifecycle.
vi.mock('../../../../../components/shared/AppDatePicker', () => ({ default: ({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) =>
  <input aria-label={label} value={value} disabled={disabled} onChange={event => onChange(event.target.value)} /> }))

const publication: FinancePublication = { id: '00000000-0000-0000-0000-000000000060', runId: maintenanceReport.id, dueDate: '2027-01-20', publishedAt: '2026-10-29T10:00:00Z', billCount: 1 }
const plainReport: MaintenanceReport = { ...maintenanceReport, sheets: maintenanceReport.sheets.map(sheet => ({ ...sheet, rows: sheet.rows.map(row => ({ ...row, arrears: 0 })) })) }
const renderActions = (report = plainReport, onPublished = vi.fn(), language: 'en' | 'ro' = 'en', mode: 'light' | 'dark' = 'light') =>
  renderWithProviders(<MemoryRouter><RoleContext.Provider value={{ ...residentContext, role: 'Admin' }}>
    <MaintenanceReportActions report={report} onExport={vi.fn()} onPublished={onPublished} />
  </RoleContext.Provider></MemoryRouter>, { language, mode })

beforeEach(() => {
  vi.restoreAllMocks(); sessionStorage.clear()
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
})
afterEach(() => { vi.unstubAllGlobals() })

describe('administrator report publication', () => {
  it.each(['light', 'dark'] as const)('orders primary Publish, secondary Export, and borderless Back in %s mode', mode => {
    renderActions(plainReport, vi.fn(), 'en', mode)
    const group = screen.getByRole('group', { name: 'Report actions' })
    expect([...group.querySelectorAll('button,a')].map(node => node.textContent)).toEqual(['Publish', 'Export Excel', 'Back to Reports'])
    expect(within(group).getByRole('button', { name: 'Publish' })).toHaveClass('MuiButton-contained')
    expect(within(group).getByRole('button', { name: 'Export Excel' })).toHaveClass('MuiButton-outlined')
    expect(within(group).getByRole('link', { name: 'Back to Reports' })).toHaveClass('MuiButton-text')
    expect(within(group).getByRole('link')).toHaveAttribute('href', '/admin/reports')
  })

  it('requires a due date and locks duplicate submissions while pending', async () => {
    const user = userEvent.setup()
    let resolve!: (value: FinancePublication) => void
    const publish = vi.spyOn(financeApi, 'publish').mockReturnValue(new Promise(value => { resolve = value }))
    const completed = vi.fn()
    renderActions(plainReport, completed)
    await user.click(screen.getByRole('button', { name: 'Publish' }))
    const dialog = screen.getByRole('dialog')
    const confirm = within(dialog).getByRole('button', { name: 'Publish' })
    expect(confirm).toBeDisabled()
    await user.type(screen.getByLabelText('Billing due date'), '2027-01-20')
    await user.click(confirm)
    expect(screen.getByRole('button', { name: 'Publishing…' })).toBeDisabled()
    expect(screen.getByLabelText('Billing due date')).toBeDisabled()
    expect(publish).toHaveBeenCalledTimes(1)
    expect(publish.mock.calls[0]).toEqual([maintenanceReport.id, expect.objectContaining({ dueDate: '2027-01-20', expectedInputVersion: 'saved-input', arrears: [] })])
    resolve(publication)
    await waitFor(() => expect(completed).toHaveBeenCalledOnce())
    expect(sessionStorage.length).toBe(0)
  })

  it('requires an explicit decision for each previous debt', async () => {
    const user = userEvent.setup()
    const publish = vi.spyOn(financeApi, 'publish').mockResolvedValue(publication)
    renderActions(maintenanceReport)
    await user.click(screen.getByRole('button', { name: 'Publish' }))
    await user.type(screen.getByLabelText('Billing due date'), '2027-01-20')
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Publish' })).toBeDisabled()
    await user.click(within(dialog).getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Already included in previous unpaid bills' }))
    await user.click(within(dialog).getByRole('button', { name: 'Publish' }))
    await waitFor(() => expect(publish).toHaveBeenCalledOnce())
    expect(publish.mock.calls[0][1].arrears).toEqual([{ apartmentId: maintenanceReport.sheets[0].rows[0].apartmentId, treatment: 'CarriedForward' }])
  })

  it('retains the exact request identity across an uncertain result and remount', async () => {
    const user = userEvent.setup()
    const publish = vi.spyOn(financeApi, 'publish').mockRejectedValueOnce(new Error('offline')).mockResolvedValue(publication)
    const first = renderActions()
    await user.click(screen.getByRole('button', { name: 'Publish' }))
    await user.type(screen.getByLabelText('Billing due date'), '2027-01-20')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Publish' }))
    expect(await screen.findByText(/Publication could not be confirmed/)).toBeVisible()
    const original = publish.mock.calls[0][1]
    first.unmount()
    renderActions()
    await user.click(screen.getByRole('button', { name: 'Publish' }))
    expect(screen.getByLabelText('Billing due date')).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Retry publication' }))
    await waitFor(() => expect(publish).toHaveBeenCalledTimes(2))
    expect(publish.mock.calls[1][1]).toEqual(original)
  })

  it('publishes an eligible correction with the retained due date and without reissuing arrears', async () => {
    const user = userEvent.setup()
    const publish = vi.spyOn(financeApi, 'publish').mockResolvedValue({ ...publication, correctsPublicationId: publication.id })
    const corrected: MaintenanceReport = { ...maintenanceReport, periodPublished: true,
      correctsPublicationId: publication.id, correctionReason: 'Supplier corrected the invoice', correctionDueDate: '2026-11-01' }
    renderActions(corrected)
    await user.click(screen.getByRole('button', { name: 'Publish correction' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByLabelText('Billing due date')).toHaveValue('2026-11-01')
    expect(within(dialog).getByLabelText('Billing due date')).toBeDisabled()
    expect(within(dialog).queryByRole('combobox')).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Publish correction' }))
    await waitFor(() => expect(publish).toHaveBeenCalledOnce())
    expect(publish.mock.calls[0][1]).toEqual(expect.objectContaining({ dueDate: '2026-11-01', arrears: [] }))
  })

  it('requires a reason before generating a correction of the current publication', async () => {
    const user = userEvent.setup()
    const generate = vi.spyOn(financeApi, 'generate')
    renderActions({ ...maintenanceReport, status: 'Published', publication, canCorrect: true })
    await user.click(screen.getByRole('button', { name: 'Issue correction' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Generate correction' })).toBeDisabled()
    await user.type(within(dialog).getByLabelText('Correction reason'), '   ')
    expect(within(dialog).getByRole('button', { name: 'Generate correction' })).toBeDisabled()
    expect(generate).not.toHaveBeenCalled()
  })

  it('recovers a legacy unlinked draft through the current publication without publishing the draft itself', async () => {
    const user = userEvent.setup()
    vi.spyOn(financeApi, 'workspace').mockResolvedValue({ ...financeWorkspace, inputVersion: 'current-input', currentPublication: publication })
    const generate = vi.spyOn(financeApi, 'generate').mockResolvedValue({ ...maintenanceReport, correctsPublicationId: publication.id })
    renderActions({ ...maintenanceReport, periodPublished: true, publication: null, currentPublication: publication, canCorrect: true })
    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Issue correction' }))
    await user.type(screen.getByLabelText('Correction reason'), 'Corrected supplier invoice')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Generate correction' }))
    await waitFor(() => expect(generate).toHaveBeenCalledOnce())
    expect(generate).toHaveBeenCalledWith(maintenanceReport.blockId, 2026, 10, expect.any(String), 'current-input',
      { correctsPublicationId: publication.id, correctionReason: 'Corrected supplier invoice' })
  })

  it.each([true, false])('shows actionable guidance for a legacy draft (latest: %s)', latest => {
    const report: MaintenanceReport = { ...maintenanceReport, periodPublished: true, publication: null,
      currentPublication: publication, canCorrect: latest, status: latest ? 'Draft' : 'Superseded' }
    renderWithProviders(<MemoryRouter><RoleContext.Provider value={{ ...residentContext, role: 'Admin' }}>
      <ReportSheets report={report} onPublished={vi.fn()} />
    </RoleContext.Provider></MemoryRouter>)
    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument()
    if (latest) {
      expect(screen.getByText(/Use Issue correction to generate a corrective revision/)).toBeVisible()
      expect(screen.getByRole('button', { name: 'Issue correction' })).toBeEnabled()
    } else {
      expect(screen.getByText('A newer revision exists. Open the latest saved report before publishing.')).toBeVisible()
      expect(screen.queryByRole('button', { name: 'Issue correction' })).not.toBeInTheDocument()
    }
  })

  it.each(['Outdated', 'Superseded', 'Published', 'CorrectionPublished'] as const)('prevents publication of a %s report', status => {
    renderActions({ ...plainReport, status })
    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument()
  })

  it('displays the header actions in Romanian', () => {
    renderActions(plainReport, vi.fn(), 'ro')
    expect(screen.getByRole('button', { name: 'Publică' })).toBeEnabled()
    expect(screen.getByRole('group', { name: 'Acțiuni raport' }).querySelector('a')).toHaveClass('MuiButton-text')
  })
})
