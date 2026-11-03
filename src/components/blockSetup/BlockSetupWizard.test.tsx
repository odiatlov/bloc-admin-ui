import { screen } from '@testing-library/react'
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

describe('block setup review totals', () => {
  it.each(cases)('interpolates all counts in $language without creating the block', async labels => {
    const user = userEvent.setup()
    const onSetup = vi.fn()
    renderWithProviders(<MemoryRouter><BlockSetupWizard onClose={vi.fn()} onSimple={vi.fn()} onSetup={onSetup}
      loadResidentOptions={async () => []} /></MemoryRouter>, { language: labels.language })
    await user.click(screen.getByRole('radio', { name: labels.full }))
    await user.click(screen.getByRole('button', { name: labels.continue }))
    await user.type(screen.getByRole('textbox', { name: labels.block }), 'Block A')
    await user.click(screen.getByRole('checkbox', { name: labels.stairs }))
    await user.click(screen.getByRole('button', { name: labels.next }))
    await user.click(screen.getByRole('button', { name: labels.generate }))
    await user.click(screen.getByRole('button', { name: labels.next }))
    expect(await screen.findByText(labels.totals)).toBeVisible()
    expect(screen.queryByText(/\{\{residents\}\}/)).not.toBeInTheDocument()
    expect(onSetup).not.toHaveBeenCalled()
  })
})
