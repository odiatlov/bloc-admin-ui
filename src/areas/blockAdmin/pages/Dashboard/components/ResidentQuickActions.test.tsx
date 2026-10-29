import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../../../../../tests/render'
import ResidentQuickActions from './ResidentQuickActions'

describe('resident Pay quick action', () => {
  it('navigates to My Bills without a payment confirmation or payment request', async () => {
    renderWithProviders(<MemoryRouter initialEntries={['/admin/dashboard']}><Routes>
      <Route path="/admin/dashboard" element={<ResidentQuickActions />} />
      <Route path="/admin/finance" element={<h1>My Bills destination</h1>} />
    </Routes></MemoryRouter>)
    await userEvent.setup().click(screen.getByRole('button', { name: /pay/i }))
    expect(screen.getByRole('heading', { name: 'My Bills destination' })).toBeVisible()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
