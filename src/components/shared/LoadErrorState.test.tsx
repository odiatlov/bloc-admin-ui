import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../tests/render'
import LoadErrorState from './LoadErrorState'

describe('LoadErrorState', () => {
  it('shows a request failure and lets the user retry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    renderWithProviders(<LoadErrorState onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('The information is unavailable')
    expect(screen.getByRole('alert')).toHaveTextContent('The information could not be loaded. Please try again.')
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('prevents duplicate retries and enables retry again when the request finishes', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const { rerender } = renderWithProviders(<LoadErrorState onRetry={onRetry} isRetrying />)
    const retry = screen.getByRole('button', { name: 'Retrying...' })
    expect(retry).toBeDisabled()

    rerender(<LoadErrorState onRetry={onRetry} />)
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('supports a custom inline error message', () => {
    renderWithProviders(<LoadErrorState inline headline="Residents unavailable" helperText="Try again later." onRetry={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Residents unavailable')
    expect(screen.getByRole('alert')).toHaveTextContent('Try again later.')
    expect(screen.queryByText('The information is unavailable')).not.toBeInTheDocument()
  })

  it('renders the Romanian error and retry caption', () => {
    renderWithProviders(<LoadErrorState onRetry={vi.fn()} />, { language: 'ro' })
    expect(screen.getByRole('alert')).toHaveTextContent('Informațiile nu sunt disponibile')
    expect(screen.getByRole('button', { name: 'Reîncearcă' })).toBeEnabled()
  })
})
