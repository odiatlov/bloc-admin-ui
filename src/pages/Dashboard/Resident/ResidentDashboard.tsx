import React from 'react'
import { useTranslation } from 'react-i18next'

const ResidentDashboard: React.FC = () => {
  const { t } = useTranslation()

  return (
    <section className="dashboard">
      <h2>{t('dashboard.role.residentTitle', 'Resident Dashboard')}</h2>
      <div style={{ marginTop: 24, fontSize: 18 }}>{t('dashboard.role.residentWelcome', 'Welcome to the Resident Dashboard')}</div>
    </section>
  )
}

export default ResidentDashboard
