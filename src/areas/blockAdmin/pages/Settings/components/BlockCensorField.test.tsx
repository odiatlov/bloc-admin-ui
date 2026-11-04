import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../../../tests/render'
import { residentContext } from '../../../../../../tests/financeFixtures'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { financeReviewApi } from '../../../../../services/financeReviewApi'
import BlockCensorField from './BlockCensorField'

const block = '80e1a2b1-6abb-4113-b129-6aa42282f30e'
const assignment = 'd9234795-6d63-44e7-aaca-b4ed07c5011d'
const resident = { personId: 'f537c117-bfa0-4a93-81ca-d6b6202fe250', fullName: 'Ion Local', hasRegisteredAccount: true, email: 'ion@example.invalid', apartments: ['1'] }
const renderField = (language: 'en' | 'ro' = 'en', mode: 'light' | 'dark' = 'light') => renderWithProviders(<MemoryRouter>
  <RoleContext.Provider value={{ ...residentContext, role: 'Admin', refreshAccounts: vi.fn(async () => {}) }}><BlockCensorField blockId={block} /></RoleContext.Provider>
</MemoryRouter>, { language, mode })
beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(financeReviewApi, 'censor').mockResolvedValue({ blockId: block })
  vi.spyOn(financeReviewApi, 'candidates').mockResolvedValue({ items: [resident], totalCount: 1 })
  vi.spyOn(financeReviewApi, 'saveCensor').mockResolvedValue({ blockId: block, assignmentId: assignment, fullName: 'Ion Extern' })
})
describe('block censor settings', () => {
  it('creates an external person/account without sending housing assignments', async () => {
    const user = userEvent.setup()
    renderField()
    await user.click(await screen.findByLabelText('Censor'))
    expect(screen.getByText(/will be added to Persons without an apartment/)).toBeVisible()
    await user.type(screen.getByLabelText(/First name/), 'Ion')
    await user.type(screen.getByLabelText(/Last name/), 'Extern')
    await user.type(screen.getByLabelText(/Email/), 'ion@external.invalid')
    await user.click(screen.getByRole('button', { name: 'Assign censor' }))
    await waitFor(() => expect(financeReviewApi.saveCensor).toHaveBeenCalledOnce())
    expect(financeReviewApi.saveCensor).toHaveBeenCalledWith(block, expect.objectContaining({ mode: 'External', externalPerson: {
      firstName: 'Ion', lastName: 'Extern', email: 'ion@external.invalid', phone: null, status: 'active', invitePerson: true } }))
  })
  it('requires explicit confirmation to replace the current censor with a selected resident', async () => {
    vi.mocked(financeReviewApi.censor).mockResolvedValue({ blockId: block, assignmentId: assignment, fullName: 'Old Censor' })
    const user = userEvent.setup()
    renderField()
    await user.click(await screen.findByLabelText('Censor'))
    await user.click(screen.getByRole('radio', { name: 'From this block’s residents' }))
    await user.click(screen.getByRole('combobox', { name: 'Search residents by name or apartment' }))
    await user.click(await screen.findByRole('option', { name: 'Ion Local · Apartment 1' }))
    const save = within(screen.getByRole('dialog')).getByRole('button', { name: 'Replace censor' })
    expect(save).toBeDisabled()
    await user.click(screen.getByRole('checkbox', { name: 'I confirm withdrawal of the current censor assignment for this block.' }))
    await user.click(save)
    await waitFor(() => expect(financeReviewApi.saveCensor).toHaveBeenCalledOnce())
    expect(financeReviewApi.saveCensor).toHaveBeenCalledWith(block, expect.objectContaining({ mode: 'Resident', personId: resident.personId,
      expectedAssignmentId: assignment, confirmReplacement: true }))
  })
  it.each(['light', 'dark'] as const)('cancels the Romanian dialog without creating or assigning in %s mode', async mode => {
    const user = userEvent.setup()
    renderField('ro', mode)
    await user.click(await screen.findByLabelText('Cenzor'))
    expect(screen.getByRole('radio', { name: 'Cenzor extern' })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Anulează' }))
    expect(financeReviewApi.saveCensor).not.toHaveBeenCalled()
  })
})
