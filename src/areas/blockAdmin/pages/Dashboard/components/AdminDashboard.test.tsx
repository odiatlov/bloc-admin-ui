import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { residentContext } from '../../../../../../tests/financeFixtures'
import { renderWithProviders } from '../../../../../../tests/render'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { financeApi } from '../../../../../services/financeApi'
import AdminDashboard from './AdminDashboard'

vi.mock('../../../../../hooks/useBlocks', () => ({ useBlocks: () => ({ blocks: [] }) }))

beforeEach(() => { vi.restoreAllMocks(); sessionStorage.clear() })

it('shows the real finance totals and the publication as a dated activity item', async () => {
  vi.spyOn(financeApi, 'dashboard').mockResolvedValue({
    year: 2026, month: 10, currency: 'RON', administrationReceipts: 125.50,
    overdueBillCount: 2, pendingCashRequestCount: 3,
    activity: [{ id: '00000000-0000-0000-0000-000000000111', type: 'reportPublished',
      occurredAt: '2026-11-05T08:00:00Z', blockName: 'Bloc A', year: 2026, month: 10 }],
  })
  renderWithProviders(<MemoryRouter><RoleContext.Provider value={{ ...residentContext, role: 'Admin' }}>
    <AdminDashboard />
  </RoleContext.Provider></MemoryRouter>, { language: 'ro', mode: 'dark' })
  expect(await screen.findByText(/125,50/)).toBeVisible()
  expect(screen.getByText('Facturi pentru octombrie 2026')).toBeVisible()
  expect(screen.getByText('2')).toBeVisible()
  expect(screen.getByText('3')).toBeVisible()
  const publication = screen.getByText('Raport de cheltuieli publicat pentru octombrie 2026 · Bloc A')
  expect(publication.closest('li')).toHaveTextContent('10:00')
})
