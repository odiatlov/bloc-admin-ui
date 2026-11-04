import { useState } from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { renderWithProviders } from '../../../../../../tests/render'
import type { FinanceCharge } from '../../../../../types/finance'
import FinanceChargeClassification from './FinanceChargeClassification'

const initial: FinanceCharge = { id: '00000000-0000-0000-0000-000000000201', name: 'Cost Administrare', scope: 'Block', apartmentIds: [], amountMode: 'Pool', basis: 'People', required: true, enabled: true, order: 0, oneOff: false, kind: 'Expense', includeInMiscellaneous: false }
const Editor = () => {
  const [charge, setCharge] = useState(initial)
  return <><FinanceChargeClassification charge={charge} onChange={changes => setCharge({ ...charge, ...changes })} /><output>{JSON.stringify(charge)}</output></>
}
it('stores explicit grouping and converts balance entries to manual amounts', async () => {
  const user = userEvent.setup()
  renderWithProviders(<Editor />)
  await user.click(screen.getByRole('checkbox', { name: 'Include in Other expenses' }))
  expect(screen.getByRole('status')).toHaveTextContent('"includeInMiscellaneous":true')
  await user.click(screen.getByRole('combobox', { name: 'Entry type' }))
  await user.click(screen.getByRole('option', { name: 'Opening arrears' }))
  expect(screen.getByRole('status')).toHaveTextContent('"kind":"Arrears"')
  expect(screen.getByRole('status')).toHaveTextContent('"amountMode":"Manual"')
  expect(screen.getByRole('status')).toHaveTextContent('"includeInMiscellaneous":false')
  expect(screen.queryByRole('checkbox', { name: 'Include in Other expenses' })).not.toBeInTheDocument()
})
