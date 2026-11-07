import React from 'react'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../../tests/render'
import SetupCountersStep from './SetupCountersStep'
import { newApartment, newFloor, newGroup, type Group } from './setupDraft'
import { copyCounterZoneSettings, generateCounterZones } from './setupMeterDraft'

function Harness({ disabled = false, hasStaircases = true, names = ['A', 'B'] }: { disabled?: boolean; hasStaircases?: boolean; names?: string[] }) {
  const [groups, setGroups] = React.useState<Group[]>(() => names.map(name => ({
    ...newGroup(name), expanded: true, floors: [newFloor(0)], apartments: [{ ...newApartment('1'), floor: '0', expanded: true, hasBoiler: name === 'A' }],
  })))
  const update = (id: string, change: (group: Group) => Group) => setGroups(value => value.map(group => group.id === id ? change(group) : group))
  return <SetupCountersStep groups={groups} hasStaircases={hasStaircases} blockName="Block" disabled={disabled} showErrors={false}
    onUpdate={update} onGenerate={group => update(group.id, () => generateCounterZones(group, type => type).group ?? group)}
    onCopy={group => setGroups(value => copyCounterZoneSettings(value, group.id))}
    onEntered={() => {}} onFocusRequest={() => {}} />
}

describe('counter setup zone selection', () => {
  it('starts with one dropdown per stair and adds and removes fields locally', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)
    const section = screen.getAllByRole('region', { name: 'Zones for every apartment' })[0]
    expect(within(section).getAllByRole('combobox')).toHaveLength(1)
    await user.click(within(section).getByRole('button', { name: 'Add zone field' }))
    expect(within(section).getAllByRole('combobox')).toHaveLength(2)
    expect(within(screen.getAllByRole('region', { name: 'Zones for every apartment' })[1]).getAllByRole('combobox')).toHaveLength(1)
    await user.click(within(section).getAllByRole('button', { name: 'Remove zone field' })[1])
    expect(within(section).getAllByRole('combobox')).toHaveLength(1)
  })

  it('generates only for the selected stair and disables hot water in boiler apartments', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)
    const section = screen.getAllByRole('region', { name: 'Zones for every apartment' })[0]
    await user.click(within(section).getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Kitchen' }))
    await user.click(screen.getByRole('button', { name: 'Generate meters for A' }))
    expect(await screen.findByRole('spinbutton', { name: 'Hot' })).toBeDisabled()
    expect(screen.getByRole('spinbutton', { name: 'Hot' })).toHaveValue(0)
    expect(screen.getByRole('spinbutton', { name: 'Cold' })).toHaveValue(1)
    expect(screen.getByText('No water index places are configured for this apartment.')).toBeVisible()
  })

  it('locks generation and zone controls while saving', () => {
    renderWithProviders(<Harness disabled />)
    expect(screen.getByRole('button', { name: 'Generate meters for A' })).toBeDisabled()
    expect(screen.getAllByRole('button', { name: 'Add zone field' })[0]).toBeDisabled()
    expect(screen.getAllByRole('button', { name: 'Copy zone settings to other staircases' })[0]).toBeDisabled()
  })

  it('copies zone fields from the button after Generate without changing apartment meters or collapsing the stair', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)
    const sections = screen.getAllByRole('region', { name: 'Zones for every apartment' })
    await user.click(within(sections[0]).getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Kitchen' }))
    await user.click(within(sections[0]).getByRole('button', { name: 'Add zone field' }))
    await user.click(within(sections[0]).getByRole('combobox', { name: /Zone 2/ }))
    await user.click(screen.getByRole('option', { name: 'Bathroom' }))
    await user.click(screen.getByRole('button', { name: 'Generate meters for A' }))
    const generate = screen.getByRole('button', { name: 'Generate meters for A' })
    const copy = screen.getAllByRole('button', { name: 'Copy zone settings to other staircases' })[0]
    expect(generate.compareDocumentPosition(copy) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await user.click(copy)
    expect(sections[0]).toBeVisible()
    expect(within(sections[1]).getAllByRole('combobox')).toHaveLength(2)
    expect(within(sections[1]).getByRole('combobox', { name: /Zone 1/ })).toHaveTextContent('Kitchen')
    expect(within(sections[1]).getByRole('combobox', { name: /Zone 2/ })).toHaveTextContent('Bathroom')
    expect(screen.getByText('No water index places are configured for this apartment.')).toBeVisible()
    expect(screen.getAllByRole('spinbutton', { name: 'Cold' })).toHaveLength(2)
    await user.click(within(sections[1]).getByRole('combobox', { name: /Zone 2/ }))
    await user.click(screen.getByRole('option', { name: 'Secondary bathroom' }))
    expect(within(sections[0]).getByRole('combobox', { name: /Zone 2/ })).toHaveTextContent('Bathroom')
    await user.click(screen.getByRole('button', { name: 'Generate meters for B' }))
    const apartmentB = screen.getAllByRole('article', { name: 'Apartment 1' })[1]
    for (const field of within(apartmentB).getAllByRole('spinbutton', { name: 'Hot' })) {
      expect(field).toBeEnabled()
      expect(field).toHaveValue(1)
    }
  })

  it('disables copy for a single stair', () => {
    renderWithProviders(<Harness names={['A']} />)
    expect(screen.getByRole('button', { name: 'Copy zone settings to other staircases' })).toBeDisabled()
  })

  it('omits copy for a block without stairs', () => {
    renderWithProviders(<Harness names={['A']} hasStaircases={false} />)
    expect(screen.queryByRole('button', { name: 'Copy zone settings to other staircases' })).not.toBeInTheDocument()
  })
})
