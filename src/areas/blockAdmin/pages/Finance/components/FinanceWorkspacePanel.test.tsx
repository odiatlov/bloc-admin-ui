import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { residentContext } from '../../../../../../tests/financeFixtures'
import { renderWithProviders } from '../../../../../../tests/render'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { financeApi } from '../../../../../services/financeApi'
import { waterReadingsApi } from '../../../../../services/waterReadingsApi'
import type { FinanceBlock, FinanceWorkspace } from '../../../../../types/finance'
import type { BlockWaterReadingSettingsResponse } from '../../../../../types/waterReadings'
import FinanceWorkspacePanel from './FinanceWorkspacePanel'

const blocks: FinanceBlock[] = [
  { id: '00000000-0000-0000-0000-000000000101', name: 'First block', hasStaircases: false, staircases: [] },
  { id: '00000000-0000-0000-0000-000000000102', name: 'Second block', hasStaircases: false, staircases: [] },
]
const settings = (blockId: string): BlockWaterReadingSettingsResponse => ({
  id: '00000000-0000-0000-0000-000000000103', blockId,
  firstSubmissionDate: blockId === blocks[0].id ? '2026-09-22' : '2026-10-22',
  monthlyDueDay: 22, isEnabled: true, updatedAt: '2026-10-29T12:00:00Z',
})
const workspace: FinanceWorkspace = {
  blockId: blocks[0].id, blockName: blocks[0].name, year: 2026, month: 9,
  configurationVersion: 1, configurationEditVersion: 1,
  configuration: { effectiveFromYear: 2026, effectiveFromMonth: 8, supplyGroups: [], charges: [], apartmentHeating: [] },
  periodVersion: 0, periodData: { expenses: [], apartmentInputs: [], supplyInputs: [], adjustments: [] },
  inputVersion: 'fixture-version', canGenerate: false, issues: [], apartments: [], mainMeters: [], availablePeriods: [],
}

const renderPanel = (entry = '/admin/finance') => renderWithProviders(<MemoryRouter initialEntries={[entry]}>
  <RoleContext.Provider value={{ ...residentContext, role: 'Admin' }}>
    <FinanceWorkspacePanel>{(data, _block, _refresh, onDirty) => <>
      <output aria-label="Workspace">{data.blockId}:{data.year}-{String(data.month).padStart(2, '0')}</output>
      <button onClick={() => onDirty(true)}>Edit monthly expenses</button>
    </>}</FinanceWorkspacePanel>
  </RoleContext.Provider>
</MemoryRouter>)

beforeEach(() => {
  sessionStorage.clear()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 30, 12))
  vi.spyOn(financeApi, 'blocks').mockResolvedValue(blocks)
  vi.spyOn(financeApi, 'workspace').mockImplementation(async (blockId, year, month) => ({ ...workspace, blockId, year, month }))
  vi.spyOn(waterReadingsApi, 'getBlockSettings').mockImplementation(async (blockId) => settings(blockId))
})
afterEach(() => vi.useRealTimers())

describe('finance month availability', () => {
  it('allows the baseline through the current month and applies only after OK', async () => {
    renderPanel()
    await screen.findByRole('button', { name: 'Edit monthly expenses' })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /choose date/i }))
    expect(screen.getByRole('radio', { name: 'July' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'August' })).toBeEnabled()
    expect(screen.getByRole('radio', { name: 'October' })).toBeEnabled()
    expect(screen.getByRole('radio', { name: 'November' })).toBeDisabled()
    await user.click(screen.getByRole('radio', { name: 'August' }))
    expect(financeApi.workspace).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'OK' }))
    await waitFor(() => expect(financeApi.workspace).toHaveBeenCalledWith(blocks[0].id, 2026, 8, expect.any(AbortSignal)))
  })

  it.each([
    ['2026-07', 8],
    ['2026-12', 10],
  ] as const)('corrects an out-of-range linked period %s before fetching the workspace', async (period, month) => {
    renderPanel(`/admin/finance?blockId=${blocks[0].id}&period=${period}`)
    await screen.findByRole('button', { name: 'Edit monthly expenses' })
    expect(financeApi.workspace).toHaveBeenCalledExactlyOnceWith(blocks[0].id, 2026, month, expect.any(AbortSignal))
  })

  it('corrects a restored period and recalculates the start when block scope changes', async () => {
    sessionStorage.setItem(JSON.stringify(['page-filters-v1', residentContext.account.id, 'Admin', '/admin/finance', 'finance.selection']),
      JSON.stringify({ blockId: blocks[0].id, period: '2026-07' }))
    renderPanel()
    await screen.findByRole('button', { name: 'Edit monthly expenses' })
    expect(financeApi.workspace).toHaveBeenCalledWith(blocks[0].id, 2026, 8, expect.any(AbortSignal))
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox', { name: 'Block' }))
    await user.click(screen.getByRole('option', { name: 'Second block' }))
    await waitFor(() => expect(financeApi.workspace).toHaveBeenCalledWith(blocks[1].id, 2026, 9, expect.any(AbortSignal)))
    expect(financeApi.workspace).not.toHaveBeenCalledWith(blocks[1].id, 2026, 8, expect.any(AbortSignal))
    await waitFor(() => expect(screen.getByRole('button', { name: /choose date/i })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: /choose date/i }))
    expect(screen.getByRole('radio', { name: 'August' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'September' })).toBeEnabled()
  })

  it('retains the discard confirmation for unsaved monthly changes', async () => {
    renderPanel()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Edit monthly expenses' }))
    await user.click(screen.getByRole('button', { name: /choose date/i }))
    await user.click(screen.getByRole('radio', { name: 'August' }))
    await user.click(screen.getByRole('button', { name: 'OK' }))
    const dialog = await screen.findByRole('dialog', { name: 'Unsaved monthly changes' })
    expect(financeApi.workspace).toHaveBeenCalledTimes(1)
    await user.click(within(dialog).getByRole('button', { name: 'Discard changes' }))
    await waitFor(() => expect(financeApi.workspace).toHaveBeenCalledWith(blocks[0].id, 2026, 8, expect.any(AbortSignal)))
  })

  it('keeps settings failures separate from an empty workspace and retries', async () => {
    vi.mocked(waterReadingsApi.getBlockSettings).mockRejectedValueOnce(new Error('Settings offline'))
    renderPanel()
    expect(await screen.findByText('Settings offline')).toBeVisible()
    expect(financeApi.workspace).not.toHaveBeenCalled()
    await userEvent.setup().click(screen.getByRole('button', { name: /retry/i }))
    await screen.findByRole('button', { name: 'Edit monthly expenses' })
    expect(financeApi.workspace).toHaveBeenCalledWith(blocks[0].id, 2026, 9, expect.any(AbortSignal))
  })
})
