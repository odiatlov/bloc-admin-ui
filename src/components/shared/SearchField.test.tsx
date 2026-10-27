import { useState } from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../tests/render'
import SearchField from './SearchField'

function ControlledSearch() {
  const [value, setValue] = useState('')
  return <SearchField label="Search residents" value={value} onChange={(event) => setValue(event.target.value)} onClear={() => setValue('')} />
}

describe('SearchField', () => {
  it('accepts text and clears it while returning focus to the input', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ControlledSearch />)
    const input = screen.getByRole('searchbox', { name: 'Search residents' })

    expect(screen.queryByRole('button', { name: 'Clear filters: Search residents' })).not.toBeInTheDocument()
    await user.type(input, 'Popescu')
    expect(input).toHaveValue('Popescu')

    await user.click(screen.getByRole('button', { name: 'Clear filters: Search residents' }))
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Clear filters: Search residents' })).not.toBeInTheDocument()
  })

  it('prevents editing and clearing when disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onClear = vi.fn()
    renderWithProviders(<SearchField label="Search residents" value="Popescu" disabled onChange={onChange} onClear={onClear} />)

    const input = screen.getByRole('searchbox', { name: 'Search residents' })
    const clear = screen.getByRole('button', { name: 'Clear filters: Search residents' })
    expect(input).toBeDisabled()
    expect(clear).toBeDisabled()
    await user.type(input, 'Other')
    expect(onChange).not.toHaveBeenCalled()
    expect(onClear).not.toHaveBeenCalled()
  })

  it('translates the accessible clear action into Romanian', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    renderWithProviders(<SearchField label="Rezidenți" value="Popescu" onChange={vi.fn()} onClear={onClear} />, { language: 'ro' })

    await user.click(screen.getByRole('button', { name: 'Șterge filtrele: Rezidenți' }))
    expect(onClear).toHaveBeenCalledOnce()
  })
})
