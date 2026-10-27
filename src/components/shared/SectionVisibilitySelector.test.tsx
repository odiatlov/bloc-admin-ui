import { screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../tests/render'
import SectionVisibilitySelector from './SectionVisibilitySelector'

function setup(visibleIds = ['finance', 'water']) {
  const onToggle = vi.fn()
  renderWithProviders(<SectionVisibilitySelector
    ariaLabel="Choose sections" label="Sections" visibleCountLabel={String(visibleIds.length)} visibleIds={visibleIds}
    options={[{ id: 'finance', label: 'Finance' }, { id: 'water', label: 'Water' }]}
    minimumVisibleMessage="Keep at least one section visible" onToggle={onToggle}
  />)
  return onToggle
}

describe('SectionVisibilitySelector', () => {
  it('exposes selected options and sends the selected section ID', async () => {
    const user = userEvent.setup()
    const onToggle = setup()
    const trigger = screen.getByRole('button', { name: 'Choose sections' })
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const water = screen.getByRole('menuitem', { name: 'Water' })
    expect(within(water).getByRole('checkbox')).toBeChecked()
    await user.click(water)
    expect(onToggle).toHaveBeenCalledExactlyOnceWith('water')
  })

  it('protects the last visible section while allowing another section to be enabled', async () => {
    const user = userEvent.setup()
    const onToggle = setup(['finance'])
    await user.click(screen.getByRole('button', { name: 'Choose sections' }))
    const finance = screen.getByRole('menuitem', { name: 'Finance' })
    expect(finance).toHaveAttribute('aria-disabled', 'true')
    expect(finance).toHaveAttribute('title', 'Keep at least one section visible')
    const water = screen.getByRole('menuitem', { name: 'Water' })
    expect(within(water).getByRole('checkbox')).not.toBeChecked()
    await user.click(water)
    expect(onToggle).toHaveBeenCalledExactlyOnceWith('water')
  })

  it('closes the menu with Escape', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: 'Choose sections' }))
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Choose sections' })).not.toHaveAttribute('aria-expanded')
  })
})
