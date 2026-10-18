import React from 'react'
import { Alert, Box, Button, CircularProgress, Paper, Typography } from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import { useTranslation } from 'react-i18next'
import AppDatePicker from '../../../../../components/shared/AppDatePicker'
import LoadErrorState from '../../../../../components/shared/LoadErrorState'
import { waterReadingsApi } from '../../../../../services/waterReadingsApi'
import FinanceWorkspacePanel from '../../Finance/components/FinanceWorkspacePanel'
import FinanceConfigurationEditor from '../../Finance/components/FinanceConfigurationEditor'

const WaterSubmissionSettings: React.FC<{ blockId: string }> = ({ blockId }) => {
  const { t } = useTranslation()
  const [retry, setRetry] = React.useState(0)
  const [state, setState] = React.useState<{ date: string; error: string | null; loaded: boolean }>({ date: '', error: null, loaded: false })
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  React.useEffect(() => {
    let active = true
    waterReadingsApi.getBlockSettings(blockId).then((value) => { if (active) setState({ date: value.firstSubmissionDate?.slice(0, 10) ?? '', error: null, loaded: true }) }).catch((error) => { if (active) setState({ date: '', error: error.message, loaded: true }) })
    return () => { active = false }
  }, [blockId, retry])
  const save = async () => {
    setSaving(true); setMessage(null)
    try {
      const day = state.date ? Number(state.date.slice(8, 10)) : 22
      await waterReadingsApi.updateBlockSettings(blockId, { firstSubmissionDate: state.date || null, isEnabled: !!state.date, monthlyDueDay: Math.min(day, 28) })
      setMessage(t('finance.billing.settingsSaved'))
    } catch (error) { setMessage(error instanceof Error ? error.message : t('finance.billing.saveFailed')) }
    finally { setSaving(false) }
  }
  return <Paper sx={{ p: 2, display: 'grid', gap: 2 }}>
    <Typography variant="h6">{t('finance.billing.submissionCalendar')}</Typography>
    {!state.loaded ? <CircularProgress size={24} /> : state.error ? <LoadErrorState helperText={state.error} onRetry={() => setRetry((value) => value + 1)} /> : <>
      <AppDatePicker label={t('settings.fields.waterIndexFirstSubmissionDate')} value={state.date} onChange={(date) => setState({ ...state, date })} disabled={saving} />
      {message && <Alert severity="info">{message}</Alert>}
      <Button variant="outlined" startIcon={<SaveIcon />} disabled={saving} onClick={() => void save()}>{t('common.save')}</Button>
    </>}
  </Paper>
}

const BlockFinanceSettings: React.FC = () => <FinanceWorkspacePanel>{(workspace, block, refresh, onDirty) => <Box sx={{ display: 'grid', gap: 2 }}>
  <FinanceConfigurationEditor key={`${block.id}:${workspace.configurationVersion}:${workspace.year}:${workspace.month}`} workspace={workspace} block={block} refresh={refresh} onDirty={onDirty} />
  <WaterSubmissionSettings key={block.id} blockId={block.id} />
</Box>}</FinanceWorkspacePanel>
export default BlockFinanceSettings
