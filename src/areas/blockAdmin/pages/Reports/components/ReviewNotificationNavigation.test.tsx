import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../../../tests/render'
import { maintenanceReport, residentContext } from '../../../../../../tests/financeFixtures'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { financeApi } from '../../../../../services/financeApi'
import MaintenanceReportViewer from './MaintenanceReportViewer'

const cycle = '0cce0b79-9d1d-4536-9e4c-35afba1fc3ed'
// JSDOM has no layout observer; keep the real report UI while stubbing this browser API.
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
  })
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
function NotificationRoute() {
  const navigate = useNavigate()
  return <>
    <button onClick={() => navigate(`/admin/reports/maintenance/${maintenanceReport.id}?submissionId=${cycle}`)}>Open approval notification</button>
    <Routes><Route path="/admin/reports/maintenance/:runId" element={<MaintenanceReportViewer />} /></Routes>
  </>
}

describe('review notification navigation', () => {
  it('refreshes capabilities when an approval link targets the already open report', async () => {
    const user = userEvent.setup()
    const pending = { ...maintenanceReport, review: { ...maintenanceReport.review!, censorRequired: true, canPublish: false, status: 'Submitted' as const } }
    const approved = { ...pending, review: { ...pending.review, status: 'Approved' as const, canPublish: true } }
    const read = vi.spyOn(financeApi, 'report').mockResolvedValueOnce(pending).mockResolvedValue(approved)
    renderWithProviders(<MemoryRouter initialEntries={[`/admin/reports/maintenance/${maintenanceReport.id}`]}>
      <RoleContext.Provider value={{ ...residentContext, role: 'Admin' }}><NotificationRoute /></RoleContext.Provider>
    </MemoryRouter>)
    await screen.findByText('Submitted')
    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Open approval notification' }))
    expect(await screen.findByRole('button', { name: 'Publish' })).toBeEnabled()
    expect(read).toHaveBeenCalledTimes(2)
  })
})
