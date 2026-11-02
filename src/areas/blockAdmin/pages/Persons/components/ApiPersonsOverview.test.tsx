import type { ContextType } from 'react'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../../../tests/render'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { useBlocks } from '../../../../../hooks/useBlocks'
import { personsApi } from '../../../../../services/personsApi'
import type { BlockOverview } from '../../../../../types/block'
import type { PersonResponse } from '../../../../../types/management'
import ApiPersonsOverview from './ApiPersonsOverview'

vi.mock('../../../../../hooks/useBlocks', () => ({ useBlocks: vi.fn() }))
vi.mock('../../../../../services/personsApi', () => ({ personsApi: {
  getAll: vi.fn(), getById: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), removeMany: vi.fn(), removeUnassigned: vi.fn(),
} }))
vi.mock('../../../../../components/shared/PagedResponsiveDataView', async () => ({
  default: (await import('../../../../../components/shared/ResponsiveDataView')).default,
}))

const a = 'a7845fca-2096-4ba1-a54c-3f331c4d9844'
const b = '7e3a4eb9-fc2f-42fa-baf2-f0c89bf159ea'
const person: PersonResponse = {
  id: 'd4e749ea-6b03-44f5-b242-3b7d009f26e6', firstName: 'Ion', lastName: 'Extern', fullName: 'Ion Extern',
  phone: null, email: null, userId: null, hasRegisteredAccount: false, canDeleteUnlinkedProfile: false,
  roles: [], blockRoles: [], status: 'active', apartmentCount: 0, blocks: [], adminAccounts: [], apartments: [],
  wasExistingIdentity: false, createdAt: '2026-11-02T08:00:00Z', updatedAt: '2026-11-02T08:00:00Z',
}
const block = (id: string, name: string): BlockOverview => ({ id, name, displayName: name, administratorName: 'Admin',
  adminAccountId: 'f3445802-ab9c-431b-8721-372f15831770', hasStaircases: false, address: null,
  createdAt: person.createdAt, apartmentCount: 0, residentCount: 0, staircaseCount: 0,
  totalInvoicesAmount: 0, totalPaymentsAmount: 0, unpaidBalance: 0 })
const refreshAccounts = vi.fn(async () => {})
function renderPage(language: 'en' | 'ro' = 'en', mode: 'light' | 'dark' = 'light') {
  const account = { id: 'e6392ef9-35e3-4fc7-abdf-3dce7c7cac35', name: 'Admin', email: 'admin@example.test',
    systemRole: 'None' as const, roles: ['Admin' as const], blockRoles: ['Admin' as const],
    defaultRole: 'Admin' as const, token: 'test', adminId: 'f3445802-ab9c-431b-8721-372f15831770' }
  const context: ContextType<typeof RoleContext> = { account, accounts: [account], role: 'Admin', token: 'test',
    accountsError: null, accountsLoading: false, isAuthenticated: true, refreshAccounts,
    login: vi.fn(), logout: vi.fn(), setRole: vi.fn() }
  return renderWithProviders(<MemoryRouter><RoleContext.Provider value={context}><ApiPersonsOverview /></RoleContext.Provider></MemoryRouter>, { language, mode })
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useBlocks).mockReturnValue({ blocks: [block(a, 'Block A'), block(b, 'Block B')], totalBlocks: 2,
    error: null, isLoading: false, refresh: vi.fn(async () => true), search: '', setSearch: vi.fn() })
  vi.mocked(personsApi.getAll).mockResolvedValue([person])
  vi.mocked(personsApi.update).mockResolvedValue(person)
})

describe('Persons and external censor appointments', () => {
  it('does not label an unassigned person as a resident', async () => {
    renderPage()
    // The responsive view keeps both table and cards mounted; text is not globally unique.
    const table = within(await screen.findByRole('table', { hidden: true }))
    expect(table.getByText('Ion Extern')).toBeInTheDocument()
    expect(table.getByText('No assigned roles')).toBeInTheDocument()
    expect(table.queryByText('Resident')).not.toBeInTheDocument()
  })

  it('invites and appoints an external person to multiple blocks in one save', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Edit person' }))
    await user.click(screen.getByRole('combobox', { name: 'Blocks managed by you' }))
    await user.click(screen.getByRole('option', { name: 'Block A' }))
    await user.click(screen.getByRole('option', { name: 'Block B' }))
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    await user.click(screen.getByRole('checkbox', { name: 'Create or link an application account' }))
    await user.type(screen.getByRole('textbox', { name: /^Email/ }), 'ion@example.test')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(personsApi.update).toHaveBeenCalledWith(person.id, expect.objectContaining({
      invitePerson: true, email: 'ion@example.test', censorBlockIds: [a, b], expectedCensorBlockIds: [], clearBlockAssignments: false,
    })))
    await waitFor(() => expect(refreshAccounts).toHaveBeenCalled())
  })

  it('cancels draft appointment changes without an immediate assignment request', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Edit person' }))
    await user.click(screen.getByRole('combobox', { name: 'Blocks managed by you' }))
    await user.click(screen.getByRole('option', { name: 'Block A' }))
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(personsApi.update).not.toHaveBeenCalled()
  })

  it('keeps both censor and resident qualities visible', async () => {
    vi.mocked(personsApi.getAll).mockResolvedValue([{ ...person, roles: ['Censor', 'Resident'],
      blockRoles: [{ blockId: a, blockName: 'Block A', role: 'Censor' }] }])
    renderPage()
    const table = within(await screen.findByRole('table', { hidden: true }))
    expect(table.getByText('Censor, Resident')).toBeInTheDocument()
  })

  it('shows a request failure with retry instead of an empty persons list', async () => {
    vi.mocked(personsApi.getAll).mockRejectedValueOnce(new Error('Unavailable'))
    renderPage()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.queryByRole('table', { hidden: true })).not.toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Retry' }))
    const table = within(await screen.findByRole('table', { hidden: true }))
    expect(table.getByText('Ion Extern')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it.each(['light', 'dark'] as const)('offers unassigned person creation without housing in Romanian in %s mode', async mode => {
    const user = userEvent.setup()
    vi.mocked(personsApi.getAll).mockResolvedValue([])
    renderPage('ro', mode)
    await user.click(await screen.findByRole('button', { name: /^Adaugă persoană$/ }))
    expect(screen.getByRole('textbox', { name: /Prenume/ })).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Blocurile gestionate de tine' })).not.toBeInTheDocument()
    expect(screen.getByText(/fără bloc sau apartament/)).toBeInTheDocument()
  })
})
