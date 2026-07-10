import React from 'react'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../../components/shared/PageHeader'
import ReportGenerator from './components/ReportGenerator'

const Reports: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Box>
      <PageHeader title={t('pages.reports.title')} description={t('pages.reports.description')} />
      <ReportGenerator />
    </Box>
  )
}

export default Reports
