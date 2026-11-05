import { useState } from 'react'
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../tests/render'
import ResidentSetupFields from './ResidentSetupFields'
import { apartmentValidationErrors, newApartment } from './setupDraft'

const inviteEmailError = 'Enter a valid email address for the account invitation.'

function ResidentFieldsHarness() {
  const [value, setValue] = useState(() => newApartment().resident)
  return <ResidentSetupFields value={value} onChange={patch => setValue(current => ({ ...current, ...patch }))}
    persons={[]} loading={false} error={false} disabled={false} onRetry={vi.fn()} />
}

it('shows invalid invite emails after blur and clears the error on correction', async () => {
  const user = userEvent.setup()
  renderWithProviders(<ResidentFieldsHarness />)
  await user.click(screen.getByRole('checkbox', { name: 'Create or link an application account' }))
  const email = screen.getByRole('textbox', { name: /Email/ })
  await user.click(email)
  fireEvent.change(email, { target: { value: 'invalid' } })
  expect(screen.queryByText(inviteEmailError)).not.toBeInTheDocument()
  await user.tab()
  expect(email).toHaveAttribute('aria-invalid', 'true')
  expect(screen.getByText(inviteEmailError)).toBeVisible()

  await user.click(email)
  fireEvent.change(email, { target: { value: 'ana@example.test' } })
  expect(email).not.toHaveAttribute('aria-invalid', 'true')
  expect(screen.queryByText(inviteEmailError)).not.toBeInTheDocument()
})

it('requires a valid email to proceed only when an account invitation is requested', () => {
  const apartment = newApartment('1')
  apartment.addResident = true
  apartment.resident = { ...apartment.resident, firstName: 'Ana', lastName: 'Pop', invitePerson: true }

  expect(apartmentValidationErrors(apartment)).toEqual({ email: 'email' })
  apartment.resident.email = 'invalid'
  expect(apartmentValidationErrors(apartment)).toEqual({ email: 'email' })
  apartment.resident.email = 'ana@example.test'
  expect(apartmentValidationErrors(apartment)).toEqual({})

  apartment.resident.email = ''
  apartment.resident.invitePerson = false
  expect(apartmentValidationErrors(apartment)).toEqual({})
})
