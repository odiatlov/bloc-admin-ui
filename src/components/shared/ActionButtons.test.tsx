import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../tests/render'
import ActionButtons, { type ActionButtonDefinition } from './ActionButtons'

describe('ActionButtons', () => {
  it.each(['row', 'card'] as const)('uses priority and visibility to select the main %s action', async (variant) => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const actions: ActionButtonDefinition[] = [
      { id: 'hidden', label: 'Restricted action', icon: null, priority: 100, visible: false },
      { id: 'view', label: 'View', icon: null },
      { id: 'edit', label: 'Edit', icon: null, priority: 10, onClick: onEdit },
    ]
    renderWithProviders(<ActionButtons variant={variant} actions={actions} />)

    expect(screen.queryByRole('button', { name: 'Restricted action' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'View' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(onEdit).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: 'More actions' }))
    expect(screen.getByRole('menuitem', { name: 'View' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Restricted action' })).not.toBeInTheDocument()
  })

  it('executes a secondary action and closes its menu without triggering the row', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    const onDelete = vi.fn()
    renderWithProviders(<div onClick={onRowClick}><ActionButtons variant="row" actions={[
      { id: 'view', label: 'View', icon: null },
      { id: 'delete', label: 'Delete', icon: null, onClick: onDelete },
    ]} /></div>)

    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledOnce()
    expect(onRowClick).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })

  it('retains a disabled main action and prevents executing disabled overflow actions', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    renderWithProviders(<ActionButtons variant="row" actions={[
      { id: 'edit', label: 'Edit', icon: null, priority: 10, disabled: true, onClick: onEdit },
      { id: 'delete', label: 'Delete', icon: null, disabled: true, onClick: onDelete },
    ]} />)

    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'More actions' }))
    const item = screen.getByRole('menuitem', { name: 'Delete' })
    expect(item).toHaveAttribute('aria-disabled', 'true')
    await user.keyboard('{Enter}')
    expect(onEdit).not.toHaveBeenCalled()
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('disables a loading main action and exposes its busy state', () => {
    renderWithProviders(<ActionButtons variant="card" actions={[{ id: 'save', label: 'Save', icon: null, loading: true, onClick: vi.fn() }]} />)
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByRole('button', { name: 'More actions' })).not.toBeInTheDocument()
  })

  it('keeps an explicitly inline floor action directly accessible', () => {
    renderWithProviders(<ActionButtons variant="row" actions={[
      { id: 'add', label: 'Add apartment', icon: null, priority: 10 },
      { id: 'delete', label: 'Delete floor', icon: null, alwaysInline: true },
    ]} />)
    expect(screen.getByRole('button', { name: 'Add apartment' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete floor' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'More actions' })).not.toBeInTheDocument()
  })

  it('navigates through a card action destination', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<ActionButtons variant="card" actions={[{ id: 'view', label: 'View apartment', icon: null, to: '/apartments/1' }]} />} />
        <Route path="/apartments/1" element={<h1>Apartment details</h1>} />
      </Routes>
    </MemoryRouter>)
    await user.click(screen.getByRole('link', { name: 'View apartment' }))
    expect(await screen.findByRole('heading', { name: 'Apartment details' })).toBeInTheDocument()
  })

  it('renders no actions when every action is hidden', () => {
    renderWithProviders(<ActionButtons variant="row" actions={[{ id: 'edit', label: 'Edit', icon: null, visible: false }]} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
