import { fireEvent, screen, waitFor } from '@testing-library/react'
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
    await user.click(screen.getByRole('button', { name: 'Block A (1)' }))
    await waitFor(() => expect(screen.getByText(floorCounts)).toBeVisible())
    expect(onSetup).not.toHaveBeenCalled()
  })
})
