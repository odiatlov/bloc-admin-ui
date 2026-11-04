import { Paper, TextField } from '@mui/material'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../../../tests/render'
import ActionButtons from '../../../../../components/shared/ActionButtons'
import FinanceSection from './FinanceSection'

describe('finance section header actions', () => {
  it.each(['light', 'dark'] as const)('keeps deletion independent of expansion in %s mode', async mode => {
    const user = userEvent.setup()
    const remove = vi.fn()
    renderWithProviders(<FinanceSection title="Apartment A1" defaultExpanded actions={<ActionButtons variant="row"
      actions={[{ id: 'remove', label: 'Remove A1', icon: <span>Delete</span>, onClick: remove }]} />}><p>Apartment fields</p></FinanceSection>, { mode })
    const collapse = screen.getByRole('button', { name: /Collapse.*Apartment A1/ })
    await user.click(screen.getByRole('button', { name: 'Remove A1' }))
    expect(remove).toHaveBeenCalledOnce()
    expect(collapse).toHaveAttribute('aria-expanded', 'true')
    await user.click(collapse)
    expect(screen.getByRole('button', { name: /Expand.*Apartment A1/ })).toHaveAttribute('aria-expanded', 'false')
    expect(remove).toHaveBeenCalledOnce()
  })
})

it.each(['light', 'dark'] as const)('preserves the original outlined card colors in %s mode', mode => {
  renderWithProviders(<>
    <Paper variant="outlined" data-testid="original-card">Original card</Paper>
    <FinanceSection title="Outer section"><FinanceSection title="Inner expense" variant="outlined">Fields</FinanceSection></FinanceSection>
  </>, { mode })
  const original = screen.getByTestId('original-card')
  const section = screen.getByText('Inner expense').closest('.MuiAccordion-root') as HTMLElement
  expect(section).toHaveClass('MuiPaper-outlined')
  expect(getComputedStyle(section).backgroundColor).toBe(getComputedStyle(original).backgroundColor)
  expect(getComputedStyle(section).backgroundImage).toBe('none')
})

it.each([
  { mode: 'light' as const, compact: false },
  { mode: 'dark' as const, compact: false },
  { mode: 'light' as const, compact: true },
  { mode: 'dark' as const, compact: true },
])('keeps standard title-to-form spacing in $mode mode, compact=$compact', ({ mode, compact }) => {
  renderWithProviders(<FinanceSection title="Expense form" compact={compact} defaultExpanded>
    <TextField label="Entry type" value="Current expense" />
  </FinanceSection>, { mode })
  const content = screen.getByRole('textbox', { name: 'Entry type' }).closest('.MuiAccordionDetails-root') as HTMLElement
  expect(getComputedStyle(content).paddingTop).toBe('16px')
})
