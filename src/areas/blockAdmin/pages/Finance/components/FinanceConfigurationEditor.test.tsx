import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../../../tests/render'
import { residentContext } from '../../../../../../tests/financeFixtures'
import { RoleContext } from '../../../../../contexts/RoleContext'
import { financeApi } from '../../../../../services/financeApi'
import type { FinanceBlock, FinanceWorkspace } from '../../../../../types/finance'
import en from '../../../../../i18n/locales/en.json'
import ro from '../../../../../i18n/locales/ro.json'
import FinanceConfigurationEditor from './FinanceConfigurationEditor'

vi.mock('../../Settings/components/BlockCensorField', () => ({ default: () => <span>Censor assignment</span> }))
const groupId = '00000000-0000-0000-0000-000000000301'
const chargeId = '00000000-0000-0000-0000-000000000302'
const block: FinanceBlock = { id: '00000000-0000-0000-0000-000000000303', name: 'Fixture block', hasStaircases: false, staircases: [] }
const workspace: FinanceWorkspace = {
  blockId: block.id, blockName: block.name, year: 2026, month: 10,
  configurationVersion: 1, configurationEditVersion: 1, periodVersion: 0, inputVersion: 'fixture', canGenerate: true,
  issues: [], apartments: [], mainMeters: [], availablePeriods: [],
  periodData: { supplyInputs: [], expenses: [], adjustments: [], apartmentInputs: [] },
  configuration: { effectiveFromYear: 2026, effectiveFromMonth: 10, apartmentHeating: [],
    supplyGroups: [{ id: groupId, name: 'Alimentare A', utilityType: 'ColdWater', scope: 'Block', apartmentIds: [], differenceMode: 'None', differenceBasis: 'Equal', order: 0 }],
    charges: [{ id: chargeId, name: 'Cost Administrare', scope: 'Block', apartmentIds: [], amountMode: 'Rate', basis: 'Equal', rate: 25, required: true, enabled: true, oneOff: false, order: 0 }],
  },
}
const setup = (language: 'en' | 'ro' = 'en', currentWorkspace = workspace) => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  const save = vi.spyOn(financeApi, 'saveConfiguration').mockResolvedValue({ version: 2, configuration: workspace.configuration })
  const refresh = vi.fn()
  renderWithProviders(<MemoryRouter><RoleContext.Provider value={{ ...residentContext, role: 'Admin' }}>
    <FinanceConfigurationEditor workspace={currentWorkspace} block={block} refresh={refresh} onDirty={vi.fn()} />
  </RoleContext.Provider></MemoryRouter>, { language })
  const locale = language === 'ro' ? ro : en
  const labels = locale.finance.billing
  const remove = (name: string) => labels.removeItem.replace('{{name}}', name)
  return { save, refresh, labels, remove, common: locale.common }
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('configuration section removal confirmation', () => {
  it.each(['en', 'ro'] as const)('confirms the named persisted removals at save time, and cancellation keeps the draft in %s', async language => {
    const user = userEvent.setup()
    const { save, refresh, labels, remove, common } = setup(language)
    await user.click(screen.getByRole('button', { name: labels.supplyGroups }))
    await user.click(screen.getByRole('button', { name: remove('Alimentare A') }))
    await user.click(screen.getByRole('button', { name: labels.chargeDefinitions }))
    await user.click(screen.getByRole('button', { name: remove('Cost Administrare') }))
    expect(save).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: labels.saveConfiguration }))
    const dialog = screen.getByRole('dialog', { name: labels.confirmRemovalTitle })
    expect(within(dialog).getByText('Alimentare A')).toBeVisible()
    expect(within(dialog).getByText('Cost Administrare')).toBeVisible()
    expect(save).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole('button', { name: common.cancel }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(save).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: remove('Alimentare A') })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: labels.saveConfiguration })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: labels.saveConfiguration }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: labels.confirmRemovalSave }))
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce())
    expect(save).toHaveBeenCalledExactlyOnceWith(block.id, 1, expect.objectContaining({ supplyGroups: [], charges: [] }))
  })

  it('saves edits without a removal dialog when no persisted section was removed', async () => {
    const user = userEvent.setup()
    const { save, labels } = setup()
    await user.click(screen.getByRole('button', { name: labels.supplyGroups }))
    await user.click(screen.getByRole('button', { name: 'Alimentare A' }))
    await user.clear(screen.getByRole('textbox', { name: labels.name }))
    await user.type(screen.getByRole('textbox', { name: labels.name }), 'Alimentare redenumita')
    await user.click(screen.getByRole('button', { name: labels.saveConfiguration }))
    await waitFor(() => expect(save).toHaveBeenCalledOnce())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not warn for a new section added and removed before its first save', async () => {
    const user = userEvent.setup()
    const { save, labels, remove } = setup()
    await user.click(screen.getByRole('button', { name: labels.chargeDefinitions }))
    await user.click(screen.getByRole('button', { name: labels.addCharge }))
    await user.click(screen.getByRole('button', { name: remove(labels.newCharge) }))
    await user.click(screen.getByRole('button', { name: labels.saveConfiguration }))
    await waitFor(() => expect(save).toHaveBeenCalledOnce())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(save.mock.calls[0][2].charges.map(charge => charge.id)).toEqual([chargeId])
  })

  it('retains the named confirmation and unsaved draft when saving fails, then allows retry', async () => {
    const user = userEvent.setup()
    const { save, refresh, labels, remove } = setup()
    save.mockRejectedValueOnce(new Error('Configuration changed'))
    await user.click(screen.getByRole('button', { name: labels.chargeDefinitions }))
    await user.click(screen.getByRole('button', { name: remove('Cost Administrare') }))
    await user.click(screen.getByRole('button', { name: labels.saveConfiguration }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: labels.confirmRemovalSave }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Configuration changed')
    expect(within(dialog).getByText('Cost Administrare')).toBeVisible()
    expect(refresh).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole('button', { name: labels.confirmRemovalSave }))
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce())
    expect(save).toHaveBeenCalledTimes(2)
  })
  it('blocks duplicate submission and cancellation while the confirmed save is pending', async () => {
    const user = userEvent.setup()
    const { save, refresh, labels, remove, common } = setup()
    let finish!: () => void
    save.mockImplementation(() => new Promise(resolve => { finish = () => resolve({ version: 2, configuration: workspace.configuration }) }))
    await user.click(screen.getByRole('button', { name: labels.chargeDefinitions }))
    await user.click(screen.getByRole('button', { name: remove('Cost Administrare') }))
    await user.click(screen.getByRole('button', { name: labels.saveConfiguration }))
    const dialog = screen.getByRole('dialog')
    const confirm = within(dialog).getByRole('button', { name: labels.confirmRemovalSave })
    await user.dblClick(confirm)
    expect(save).toHaveBeenCalledOnce()
    expect(confirm).toBeDisabled()
    expect(within(dialog).getByRole('button', { name: common.cancel })).toBeDisabled()
    await act(async () => { finish() })
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce())
  })

})

const heatingWorkspace = (): FinanceWorkspace => ({
  ...structuredClone(workspace),
  apartments: [
    { id: 'without-boiler', number: '101', contactName: 'Without boiler', setupStatus: 'configured', usableSqm: 51.25, hasBoiler: false, meters: [] },
    { id: 'with-boiler', number: '102', contactName: 'With boiler', setupStatus: 'configured', usableSqm: 60, hasBoiler: true, meters: [] },
  ],
  configuration: { ...structuredClone(workspace.configuration), defaultHeatingPercentage: 20,
    apartmentHeating: [{ apartmentId: 'without-boiler', mode: 'Percentage' }],
  },
})

const heatingRow = (number: string) => within(screen.getAllByRole('listitem').find(row => within(row).queryByText(number))!)

describe('optional heating defaults', () => {
  it.each(['en', 'ro'] as const)('previews and saves the optional block rule while allowing a boiler apartment to use full area in %s', async language => {
    const user = userEvent.setup()
    const { save, labels } = setup(language, heatingWorkspace())
    await user.click(screen.getByRole('button', { name: labels.configurationTitle.replace('{{block}}', block.name) }))
    const checkbox = screen.getByRole('checkbox', { name: labels.boilerHeatingDefaults })
    expect(checkbox).not.toBeChecked()
    await user.click(screen.getByRole('button', { name: labels.apartmentHeating }))
    expect(heatingRow('101').getByText(language === 'ro' ? '10,3 m²' : '10.3 m²')).toBeVisible()
    expect(heatingRow('102').getByRole('combobox')).toHaveTextContent(labels.notSet)
    await user.click(checkbox)
    expect(heatingRow('101').getByText(language === 'ro' ? '51,3 m²' : '51.3 m²')).toBeVisible()
    expect(heatingRow('102').getByText(language === 'ro' ? '12,0 m²' : '12.0 m²')).toBeVisible()
    await user.click(heatingRow('102').getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: labels.values.FullArea }))
    expect(heatingRow('102').getByText(language === 'ro' ? '60,0 m²' : '60.0 m²')).toBeVisible()
    await user.click(screen.getByRole('button', { name: labels.saveConfiguration }))
    await waitFor(() => expect(save).toHaveBeenCalledOnce())
    expect(save.mock.calls[0][2]).toMatchObject({ useBoilerBasedHeatingDefaults: true,
      apartmentHeating: [{ apartmentId: 'without-boiler', mode: 'Percentage' }, { apartmentId: 'with-boiler', mode: 'Percentage', percentageOverride: 100 }],
    })
  })

  it('loads full area, returns to the block percentage and preserves individual settings when the rule changes', async () => {
    const user = userEvent.setup()
    const current = heatingWorkspace()
    current.configuration.useBoilerBasedHeatingDefaults = true
    current.configuration.apartmentHeating = [
      { apartmentId: 'without-boiler', mode: 'Manual', manualMp: 0 },
      { apartmentId: 'with-boiler', mode: 'Percentage', percentageOverride: 100 },
    ]
    const { save, labels } = setup('en', current)
    await user.click(screen.getByRole('button', { name: labels.configurationTitle.replace('{{block}}', block.name) }))
    await user.click(screen.getByRole('button', { name: labels.apartmentHeating }))
    expect(heatingRow('102').getByRole('combobox')).toHaveTextContent(labels.values.FullArea)
    await user.click(screen.getByRole('checkbox', { name: labels.boilerHeatingDefaults }))
    expect(heatingRow('101').getByText('0.0 m²')).toBeVisible()
    expect(heatingRow('102').getByText('60.0 m²')).toBeVisible()
    await user.click(heatingRow('102').getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: labels.values.Percentage }))
    expect(heatingRow('102').getByText('12.0 m²')).toBeVisible()
    await user.click(screen.getByRole('button', { name: labels.saveConfiguration }))
    await waitFor(() => expect(save).toHaveBeenCalledOnce())
    expect(save.mock.calls[0][2]).toMatchObject({ useBoilerBasedHeatingDefaults: false,
      apartmentHeating: [{ apartmentId: 'without-boiler', mode: 'Manual', manualMp: 0 }, { apartmentId: 'with-boiler', mode: 'Percentage', percentageOverride: null }],
    })
  })
})
