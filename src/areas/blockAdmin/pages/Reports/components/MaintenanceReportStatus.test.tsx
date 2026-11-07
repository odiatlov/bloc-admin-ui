import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../../../../../tests/render'
import MaintenanceReportStatus from './MaintenanceReportStatus'

describe('report publication badges', () => {
  it.each([
    { language: 'en' as const, mode: 'light' as const, label: 'Correction published' },
    { language: 'en' as const, mode: 'dark' as const, label: 'Correction published' },
    { language: 'ro' as const, mode: 'light' as const, label: 'Corecție publicată' },
    { language: 'ro' as const, mode: 'dark' as const, label: 'Corecție publicată' },
  ])('identifies a published correction in $language / $mode', ({ language, mode, label }) => {
    renderWithProviders(<MaintenanceReportStatus status="CorrectionPublished" />, { language, mode })
    expect(screen.getByText(label).closest('.MuiChip-root')).toHaveClass('MuiChip-outlined', 'MuiChip-colorSuccess')
    expect(screen.queryByText('Published')).not.toBeInTheDocument()
    expect(screen.queryByText('Publicat')).not.toBeInTheDocument()
  })

  it('keeps an initial publication and an outdated draft distinguishable', () => {
    renderWithProviders(<><MaintenanceReportStatus status="Published" /><MaintenanceReportStatus status="Outdated" /></>)
    expect(screen.getByText('Published').closest('.MuiChip-root')).toHaveClass('MuiChip-outlined', 'MuiChip-colorSuccess')
    expect(screen.getByText('Outdated draft').closest('.MuiChip-root')).toHaveClass('MuiChip-outlined', 'MuiChip-colorWarning')
  })
})
