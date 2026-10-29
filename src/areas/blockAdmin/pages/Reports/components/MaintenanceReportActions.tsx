import { useState } from 'react'
import { Box, Button } from '@mui/material'
import PublishIcon from '@mui/icons-material/Publish'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { MaintenanceReport } from '../../../../../types/finance'
import FinancePublishDialog from './FinancePublishDialog'

type Props = { report: MaintenanceReport; onExport: () => void; onPublished: () => void }
const MaintenanceReportActions = ({ report, onExport, onPublished }: Props) => {
  const { t } = useTranslation()
  const [publishOpen, setPublishOpen] = useState(false)
  return <Box role="group" aria-label={t('financePublication.reportActions')} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
    <Button variant="contained" startIcon={<PublishIcon />} disabled={report.status !== 'Draft' || !!report.periodPublished}
      onClick={() => setPublishOpen(true)}>{t(report.publication ? 'financePublication.published' : 'financePublication.publish')}</Button>
    <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={onExport}>{t('finance.billing.exportExcel')}</Button>
    <Button variant="text" component={RouterLink} to="/admin/reports" startIcon={<ArrowBackIcon />}>{t('finance.billing.backReports')}</Button>
    {publishOpen && <FinancePublishDialog report={report} onClose={() => setPublishOpen(false)} onPublished={() => { setPublishOpen(false); onPublished() }} />}
  </Box>
}
export default MaintenanceReportActions
