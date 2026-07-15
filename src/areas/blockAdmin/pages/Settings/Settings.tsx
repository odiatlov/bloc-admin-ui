import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import SaveIcon from '@mui/icons-material/Save'
import { useTranslation } from 'react-i18next'
import { RoleContext } from '../../../../contexts/RoleContext'
import ActionBar from '../../../../components/shared/ActionBar'
import PageHeader from '../../../../components/shared/PageHeader'
import SettingsSections from './components/SettingsSections'

const Settings: React.FC = () => {
  const { t } = useTranslation()
  const { role } = React.useContext(RoleContext)
  const isResident = role === 'Resident'
  const [residentSaveSignal, setResidentSaveSignal] = React.useState(0)
  const [residentSaveState, setResidentSaveState] = React.useState({
    canSave: false,
    isSaving: false,
  })

  return (
    <Box>
      <PageHeader
        title={t('pages.settings.title')}
        description={isResident ? t('settings.resident.description') : t('pages.settings.description')}
      />
      <Box sx={{ display: 'grid', gap: 2 }}>
        <SettingsSections
          mode={isResident ? 'resident' : 'admin'}
          residentSaveSignal={residentSaveSignal}
          onResidentSaveStateChange={setResidentSaveState}
        />
        <ActionBar title={t('settings.actions.saveChanges')}>
          <Button
            disabled={isResident ? !residentSaveState.canSave : false}
            onClick={() => {
              if (isResident) setResidentSaveSignal((value) => value + 1)
            }}
            startIcon={<SaveIcon />}
            variant="contained"
            sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 160 } }}
          >
            {isResident && residentSaveState.isSaving ? t('settings.resident.profileSaving') : t('common.save')}
          </Button>
        </ActionBar>
      </Box>
    </Box>
  )
}

export default Settings
