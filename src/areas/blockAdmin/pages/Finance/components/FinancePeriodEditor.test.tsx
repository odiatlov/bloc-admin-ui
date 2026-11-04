import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../../../tests/render'
import { residentContext } from '../../../../../../tests/financeFixtures'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { financeApi } from '../../../../../services/financeApi'
import type { FinanceWorkspace } from '../../../../../types/finance'
import FinancePeriodEditor from './FinancePeriodEditor'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
it('deletes only the selected exception and saves the surviving amount and reason', async () => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  const user = userEvent.setup()
  const workspace: FinanceWorkspace = {
    blockId: '00000000-0000-0000-0000-000000000202', blockName: 'Fixture block', year: 2026, month: 10,
    configurationVersion: 1, configurationEditVersion: 1, periodVersion: 1, inputVersion: 'fixture', canGenerate: true, issues: [], mainMeters: [], availablePeriods: [],
    configuration: { effectiveFromYear: 2026, effectiveFromMonth: 10, supplyGroups: [], apartmentHeating: [],
      charges: [{ id: '00000000-0000-0000-0000-000000000203', name: 'Fixture cost', scope: 'Block', apartmentIds: [], amountMode: 'Pool', basis: 'Equal', remainderBasis: 'Equal', required: true, enabled: true, order: 0, oneOff: false }] },
    periodData: { supplyInputs: [], apartmentInputs: [], adjustments: [], expenses: [{ chargeId: '00000000-0000-0000-0000-000000000203', amount: 100, notApplicable: false,
      manualAmounts: [{ apartmentId: '00000000-0000-0000-0000-000000000204', amount: 20, reason: 'First reason' }, { apartmentId: '00000000-0000-0000-0000-000000000205', amount: 30, reason: 'Second reason' }] }] },
    apartments: [{ id: '00000000-0000-0000-0000-000000000204', number: '1', contactName: 'Alpha', setupStatus: 'configured', hasBoiler: false, meters: [] },
      { id: '00000000-0000-0000-0000-000000000205', number: '2', contactName: 'Beta', setupStatus: 'configured', hasBoiler: false, meters: [] }],
  }
  const save = vi.spyOn(financeApi, 'savePeriod').mockResolvedValue({ version: 2, data: workspace.periodData })
  renderWithProviders(<MemoryRouter><RoleContext.Provider value={{ ...residentContext, role: 'Admin' }}>
    <FinancePeriodEditor workspace={workspace} refresh={vi.fn()} onDirty={vi.fn()} />
  </RoleContext.Provider></MemoryRouter>)
  await user.click(screen.getByRole('button', { name: 'Fixture cost' }))
  await user.click(screen.getByRole('button', { name: /^Apartment exceptions/ }))
  await user.click(screen.getByRole('button', { name: 'Remove 1 — Alpha' }))
  expect(screen.queryByRole('button', { name: 'Remove 1 — Alpha' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Remove 2 — Beta' })).toBeVisible()
  expect(screen.getByDisplayValue('Second reason')).toBeVisible()
  await user.click(screen.getByRole('button', { name: /Save monthly/ }))
  await waitFor(() => expect(save).toHaveBeenCalledOnce())
  expect(save.mock.calls[0][4].expenses[0].manualAmounts).toEqual([{ apartmentId: '00000000-0000-0000-0000-000000000205', amount: 30, reason: 'Second reason' }])
})
