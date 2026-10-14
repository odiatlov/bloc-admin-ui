import { useId, type ReactNode } from 'react'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import { useTranslation } from 'react-i18next'
import FilterBar from '../shared/FilterBar'
import SearchField from '../shared/SearchField'
import type { StaircaseResponse } from '../../types/management'

type ApartmentOverviewFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  staircaseId: string
  onStaircaseChange: (value: string) => void
  staircases: Pick<StaircaseResponse, 'id' | 'name'>[]
  hasStaircases: boolean
  floor: string
  onFloorChange: (value: string) => void
  floors: string[]
  disabled?: boolean
  actions?: ReactNode
}

const ApartmentOverviewFilters = ({ search, onSearchChange, staircaseId, onStaircaseChange, staircases, hasStaircases, floor, onFloorChange, floors, disabled = false, actions }: ApartmentOverviewFiltersProps) => {
  const { t } = useTranslation()
  const id = useId()
  return <FilterBar actions={actions}>
    <SearchField size="small" label={t('blockOverviewFilters.search')} value={search}
      onChange={(event) => onSearchChange(event.target.value)} onClear={() => onSearchChange('')} disabled={disabled} />
    <FormControl size="small" disabled={disabled || !hasStaircases}>
      <InputLabel id={`${id}-staircase-label`}>{t('blocks.columns.staircase')}</InputLabel>
      <Select labelId={`${id}-staircase-label`} label={t('blocks.columns.staircase')} value={staircaseId} onChange={(event) => onStaircaseChange(event.target.value)}>
        <MenuItem value="all">{t('common.all')}</MenuItem>
        {staircases.map((staircase) => <MenuItem key={staircase.id} value={staircase.id}>{staircase.name}</MenuItem>)}
      </Select>
    </FormControl>
    <FormControl size="small" disabled={disabled || floors.length === 0}>
      <InputLabel id={`${id}-floor-label`}>{t('blocks.columns.floor')}</InputLabel>
      <Select labelId={`${id}-floor-label`} label={t('blocks.columns.floor')} value={floor} onChange={(event) => onFloorChange(event.target.value)}>
        <MenuItem value="all">{t('common.all')}</MenuItem>
        {floors.map((value) => <MenuItem key={value} value={value}>{value === 'unassigned' ? t('common.notAvailable') : value}</MenuItem>)}
      </Select>
    </FormControl>
  </FilterBar>
}

export default ApartmentOverviewFilters
