import { useTranslation } from 'react-i18next'
import AppDatePicker from '../../../../../components/shared/AppDatePicker'
import FilterBar from '../../../../../components/shared/FilterBar'

type Props = { periods: readonly string[]; value: string; onChange: (value: string) => void }

export default function ResidentBillMonthFilter({ periods, value, onChange }: Props) {
  const { t } = useTranslation()
  const months = [...new Set(periods)].sort()
  return <FilterBar>
    <AppDatePicker monthOnly confirmOnAccept allowAllMonths label={t('finance.billing.billingMonth')}
      value={value} availableMonths={months} disabled={!months.length}
      minDate={months[0] ? `${months[0]}-01` : undefined}
      maxDate={months.at(-1) ? `${months.at(-1)}-01` : undefined} onChange={onChange} />
  </FilterBar>
}
