import { Button } from '@mui/material'
import PaymentIcon from '@mui/icons-material/Payment'
import OpacityIcon from '@mui/icons-material/Opacity'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ActionBar from '../../../../../components/shared/ActionBar'

const ResidentQuickActions = ({ showPay = true }: { showPay?: boolean }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return <ActionBar title={t('dashboard.resident.quickActions')}>
    {showPay && <Button startIcon={<PaymentIcon />} variant="contained" onClick={() => navigate('/admin/finance')}>{t('dashboard.resident.pay')}</Button>}
    <Button startIcon={<OpacityIcon />} variant="outlined" onClick={() => navigate('/admin/consumption')}>{t('consumption.actions.submitIndex')}</Button>
  </ActionBar>
}
export default ResidentQuickActions
