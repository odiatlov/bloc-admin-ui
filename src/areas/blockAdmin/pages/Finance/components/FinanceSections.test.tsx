import type { ReactNode } from 'react'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { financeWorkspace, maintenanceReport, residentContext } from '../../../../../../tests/financeFixtures'
import { renderWithProviders } from '../../../../../../tests/render'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { financeApi } from '../../../../../services/financeApi'
import type { FinancePublication, FinanceWorkspace } from '../../../../../types/finance'
import FinanceSections from './FinanceSections'

const state = vi.hoisted(() => ({ workspace: undefined as FinanceWorkspace | undefined, refresh: vi.fn() }))
vi.mock('./FinanceWorkspacePanel', () => ({ default: ({ children }: {
  children: (workspace: FinanceWorkspace, block: unknown, refresh: () => void, onDirty: (dirty: boolean) => void) => ReactNode
}) => children(state.workspace!, {}, state.refresh, vi.fn()) }))
vi.mock('./FinancePeriodEditor', () => ({ default: () => null }))

const publication: FinancePublication = { id: '00000000-0000-0000-0000-000000000060', runId: '00000000-0000-0000-0000-000000000061',
  publishedAt: '2026-11-01T12:00:00Z', dueDate: '2026-11-20', billCount: 1 }
const nextId = '00000000-0000-0000-0000-000000000062'
const GeneratedReport = () => <h1>{useParams().runId}</h1>
const renderWorkspace = (language: 'en' | 'ro' = 'en') => renderWithProviders(
  <MemoryRouter initialEntries={['/admin/finance']}><RoleContext.Provider value={{ ...residentContext, role: 'Admin' }}>
    <Routes><Route path="/admin/finance" element={<FinanceSections />} />
      <Route path="/admin/reports/maintenance/:runId" element={<GeneratedReport />} /></Routes>
  </RoleContext.Provider></MemoryRouter>, { language })

beforeEach(() => { vi.restoreAllMocks(); state.refresh.mockClear(); sessionStorage.clear();
  state.workspace = { ...financeWorkspace, currentPublication: publication, inputVersion: 'previous-input',
    latestReport: { ...maintenanceReport, publication: null, periodPublished: true } }
})

describe('monthly generation after publication', () => {
  it.each(['en', 'ro'] as const)('generates a linked correction with fresh inputs and opens it in %s', async language => {
    const user = userEvent.setup()
    vi.spyOn(financeApi, 'workspace').mockResolvedValue({ ...state.workspace!, inputVersion: 'current-input' })
    const generate = vi.spyOn(financeApi, 'generate').mockResolvedValue({ ...maintenanceReport, id: nextId, correctsPublicationId: publication.id })
    renderWorkspace(language)
    const label = language === 'ro' ? 'Generează corecția' : 'Generate correction'
    await user.click(screen.getByRole('button', { name: label }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('button', { name: label })).toBeDisabled()
    expect(generate).not.toHaveBeenCalled()
    await user.type(within(dialog).getByLabelText(language === 'ro' ? 'Motivul corecției' : 'Correction reason'), '  Supplier correction  ')
    await user.click(within(dialog).getByRole('button', { name: label }))
    expect(await screen.findByRole('heading', { name: nextId })).toBeVisible()
    expect(generate).toHaveBeenCalledOnce()
    expect(generate).toHaveBeenCalledWith(maintenanceReport.blockId, 2026, 10, expect.any(String), 'current-input',
      { correctsPublicationId: publication.id, correctionReason: 'Supplier correction' })
  })

  it('retains the correction request identity after an uncertain generation result', async () => {
    const user = userEvent.setup()
    vi.spyOn(financeApi, 'workspace').mockResolvedValue({ ...state.workspace!, inputVersion: 'current-input' })
    const generate = vi.spyOn(financeApi, 'generate').mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ ...maintenanceReport, id: nextId, correctsPublicationId: publication.id })
    renderWorkspace()
    await user.click(screen.getByRole('button', { name: 'Generate correction' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Correction reason'), 'Supplier correction')
    await user.click(within(dialog).getByRole('button', { name: 'Generate correction' }))
    expect(await within(dialog).findByText(/The correction could not be generated/)).toBeVisible()
    await user.click(within(dialog).getByRole('button', { name: 'Generate correction' }))
    expect(await screen.findByRole('heading', { name: nextId })).toBeVisible()
    expect(generate).toHaveBeenCalledTimes(2)
    expect(generate.mock.calls[1]).toEqual(generate.mock.calls[0])
  })

  it('keeps correction generation disabled while prerequisites are incomplete', () => {
    state.workspace = { ...state.workspace!, canGenerate: false }
    renderWorkspace()
    expect(screen.getByRole('button', { name: 'Generate correction' })).toBeDisabled()
  })

  it('keeps ordinary generation for a month without published bills', async () => {
    const user = userEvent.setup()
    state.workspace = { ...financeWorkspace, currentPublication: null, latestReport: null }
    const generate = vi.spyOn(financeApi, 'generate').mockResolvedValue(maintenanceReport)
    renderWorkspace()
    await user.click(screen.getByRole('button', { name: 'Generate table — Fixture block' }))
    await waitFor(() => expect(state.refresh).toHaveBeenCalledOnce())
    expect(generate).toHaveBeenCalledWith(maintenanceReport.blockId, 2026, 10, expect.any(String), 'saved-input')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
