import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../tests/render'
import BlockSetupWizard from './BlockSetupWizard'

const cases = [
  { language: 'en' as const, full: 'Block with staircases and apartments', continue: 'Continue', block: /Block name/,
    stairs: 'This block has staircases', next: 'Next', generate: 'Generate',
    totals: '0 staircases · 1 apartments · 0 linked residents · 0 occupants' },
  { language: 'ro' as const, full: 'Bloc cu scări și apartamente', continue: 'Continuă', block: /Nume bloc/,
    stairs: 'Acest bloc are scări', next: 'Înainte', generate: 'Generează',
    totals: '0 scări · 1 apartamente · 0 locatari asociați · 0 persoane' },
]

async function openApartmentEditor(labels: (typeof cases)[number]) {
  const user = userEvent.setup()
  const onSetup = vi.fn()
  renderWithProviders(<MemoryRouter><BlockSetupWizard onClose={vi.fn()} onSimple={vi.fn()} onSetup={onSetup}
    loadResidentOptions={async () => []} /></MemoryRouter>, { language: labels.language })
  await user.click(screen.getByRole('radio', { name: labels.full }))
  await user.click(screen.getByRole('button', { name: labels.continue }))
  fireEvent.change(screen.getByRole('textbox', { name: labels.block }), { target: { value: 'Block A' } })
  await user.click(screen.getByRole('checkbox', { name: labels.stairs }))
  await user.click(screen.getByRole('button', { name: labels.next }))
  await user.click(screen.getByRole('button', { name: labels.generate }))
  return { user, onSetup }
}

describe('block setup review totals', () => {
  it.each(cases)('interpolates all counts in $language without creating the block', async labels => {
    const { user, onSetup } = await openApartmentEditor(labels)
    await user.click(screen.getByRole('button', { name: labels.next }))
    await user.click(screen.getByRole('button', { name: labels.next }))
    expect(await screen.findByText(labels.totals)).toBeVisible()
    expect(screen.queryByText(/\{\{residents\}\}/)).not.toBeInTheDocument()
    expect(screen.getByText(labels.language === 'ro' ? /0 persoane · 0 proprietari$/ : /0 people · 0 owners$/)).toBeInTheDocument()
    expect(onSetup).not.toHaveBeenCalled()
  })

  it('shows the declared occupant count in the floor header and review', async () => {
    const { user, onSetup } = await openApartmentEditor(cases[0])
    await user.click(await screen.findByLabelText('Add person'))
    fireEvent.change(screen.getByRole('textbox', { name: /First name/ }), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByRole('textbox', { name: /Last name/ }), { target: { value: 'Pop' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: /Number of occupants/ }), { target: { value: '4' } })
    const floorCounts = /1 apartment · 4 people · 1 owner$/
    expect(screen.getByText(floorCounts)).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Block A (1)' }))
    await waitFor(() => expect(screen.getByText(floorCounts)).toBeVisible())
    expect(onSetup).not.toHaveBeenCalled()
  })

  it('carries boiler settings into generated meters and the submitted setup request', async () => {
    const { user, onSetup } = await openApartmentEditor(cases[0])
    onSetup.mockResolvedValue({ block: {}, invitations: [] })
    fireEvent.change(within(screen.getByRole('article', { name: 'Apartment 1' })).getByRole('spinbutton', { name: 'Usable sqm' }), { target: { value: '50' } })
    await user.click(screen.getByLabelText('Apartment has boiler'))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('combobox', { name: /Zone 1/ })).toBeVisible()
    await user.click(screen.getByRole('combobox', { name: /Zone 1/ }))
    await user.click(screen.getByRole('option', { name: 'Kitchen' }))
    await user.click(screen.getByRole('button', { name: 'Generate meters for Block A' }))
    expect(await screen.findByRole('spinbutton', { name: 'Hot' })).toBeDisabled()
    expect(screen.getByRole('spinbutton', { name: 'Hot' })).toHaveValue(0)
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Block A (1)' }))
    expect(await screen.findByText('Configured')).toBeVisible()
    expect(screen.queryByText('Unconfigured')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Create Block' }))
    await waitFor(() => expect(onSetup).toHaveBeenCalledOnce())
    expect(onSetup.mock.calls[0][0].apartments[0]).toMatchObject({
      hasBoiler: true, usableSqm: 50, waterZones: [{ locationType: 'Kitchen', name: 'Kitchen', coldWaterCount: 1, hotWaterCount: 0 }],
    })
  })

  it.each([
    { surface: '', generateMeters: true },
    { surface: '0', generateMeters: true },
    { surface: '50', generateMeters: false },
  ])('keeps review unconfigured with surface "$surface" and generated meters $generateMeters', async ({ surface, generateMeters }) => {
    const { user } = await openApartmentEditor(cases[0])
    fireEvent.change(within(screen.getByRole('article', { name: 'Apartment 1' })).getByRole('spinbutton', { name: 'Usable sqm' }), { target: { value: surface } })
    await user.click(screen.getByRole('button', { name: 'Next' }))
    if (generateMeters) {
      await user.click(screen.getByRole('combobox', { name: /Zone 1/ }))
      await user.click(screen.getByRole('option', { name: 'Kitchen' }))
      await user.click(screen.getByRole('button', { name: 'Generate meters for Block A' }))
    }
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Block A (1)' }))
    expect(await screen.findByText('Unconfigured')).toBeVisible()
    expect(screen.queryByText('Configured')).not.toBeInTheDocument()
  })

  it('removes hot water when the boiler is enabled after generating meters', async () => {
    const { user } = await openApartmentEditor(cases[0])
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('combobox', { name: /Zone 1/ }))
    await user.click(screen.getByRole('option', { name: 'Kitchen' }))
    await user.click(screen.getByRole('button', { name: 'Generate meters for Block A' }))
    expect(await screen.findByRole('spinbutton', { name: 'Hot' })).toHaveValue(1)
    await user.click(screen.getByRole('button', { name: 'Back' }))
    await user.click(screen.getByLabelText('Apartment has boiler'))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByRole('spinbutton', { name: 'Hot' })).toBeDisabled()
    expect(screen.getByRole('spinbutton', { name: 'Hot' })).toHaveValue(0)
    expect(screen.getByRole('spinbutton', { name: 'Cold' })).toHaveValue(1)
  })
})
