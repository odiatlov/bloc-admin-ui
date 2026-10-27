import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../../tests/render'
import ApartmentConfigurationBadge from './ApartmentConfigurationBadge'

describe('ApartmentConfigurationBadge', () => {
  it('shows ready guidance only when surface and consumption zones are configured', () => {
    renderWithProviders(<ApartmentConfigurationBadge usableSqm="45.5" hasConsumptionZone />)
    expect(screen.getByText('Requirements met. Save to apply changes.')).toBeInTheDocument()
  })

  it('requests a consumption zone when only the surface is configured', () => {
    renderWithProviders(<ApartmentConfigurationBadge usableSqm={45} />)
    expect(screen.getByText('Add at least one consumption zone. Save to apply changes.')).toBeInTheDocument()
    expect(screen.queryByText('Requirements met. Save to apply changes.')).not.toBeInTheDocument()
  })

  it.each([null, '', 0, -1, 'invalid', Infinity])('requests a valid surface for %s when a consumption zone exists', (usableSqm) => {
    renderWithProviders(<ApartmentConfigurationBadge usableSqm={usableSqm} hasConsumptionZone />)
    expect(screen.getByText('Enter a usable surface greater than 0.')).toBeInTheDocument()
    expect(screen.queryByText('Requirements met. Save to apply changes.')).not.toBeInTheDocument()
  })

  it('explains both missing requirements and when zones can be added after creation', () => {
    renderWithProviders(<ApartmentConfigurationBadge usableSqm={null} zonesAfterCreate />)
    expect(screen.getByText('Enter a usable surface greater than 0 and add at least one consumption zone.')).toBeInTheDocument()
    expect(screen.getByText('After creation, open the apartment configuration to add consumption zones.')).toBeInTheDocument()
  })

  it('hides configuration guidance while loading or unavailable', () => {
    const { rerender } = renderWithProviders(<ApartmentConfigurationBadge usableSqm={45} hasConsumptionZone loading />)
    expect(screen.getByRole('progressbar')).toHaveAccessibleName()
    expect(screen.queryByText('Requirements met. Save to apply changes.')).not.toBeInTheDocument()

    rerender(<ApartmentConfigurationBadge usableSqm={45} hasConsumptionZone unavailable />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByText('Unable to determine status')).toBeInTheDocument()
    expect(screen.queryByText('Requirements met. Save to apply changes.')).not.toBeInTheDocument()
  })

  it('translates configured guidance into Romanian', () => {
    renderWithProviders(<ApartmentConfigurationBadge usableSqm={45} hasConsumptionZone />, { language: 'ro' })
    expect(screen.getByText('Cerințele sunt îndeplinite. Salvați pentru a aplica modificările.')).toBeInTheDocument()
  })
})
