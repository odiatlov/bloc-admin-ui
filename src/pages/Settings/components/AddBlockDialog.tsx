import React from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import { useTranslation } from 'react-i18next'
import AppDialog from '../../../components/shared/AppDialog'
import type {
  BlockOverviewDto,
  CreateBlockRequest,
} from '../../../types/block'

type AddBlockDialogProps = {
  block?: BlockOverviewDto | null
  open: boolean
  onClose: () => void
  onSubmit: (request: CreateBlockRequest) => Promise<void>
}

type BlockForm = {
  name: string
  activeAdminName: string
  apartmentCount: string
  residentCount: string
  hasStaircases: boolean
  staircaseCount: string
  address: string
}

const emptyForm: BlockForm = {
  name: '',
  activeAdminName: '',
  apartmentCount: '0',
  residentCount: '0',
  hasStaircases: false,
  staircaseCount: '0',
  address: '',
}

const AddBlockDialog: React.FC<AddBlockDialogProps> = ({
  block,
  onClose,
  onSubmit,
  open,
}) => {
  const { t } = useTranslation()
  const [form, setForm] = React.useState<BlockForm>(emptyForm)
  const [error, setError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const isEditMode = Boolean(block)

  React.useEffect(() => {
    if (!open) return

    setForm(block ? {
      name: block.name,
      activeAdminName: block.administratorName ?? '',
      apartmentCount: String(block.apartmentCount),
      residentCount: String(block.residentCount),
      hasStaircases: block.hasStaircases,
      staircaseCount: String(block.staircaseCount),
      address: block.address ?? '',
    } : emptyForm)
    setError(null)
  }, [block, open])

  const apartmentCount = Number(form.apartmentCount)
  const residentCount = Number(form.residentCount)
  const staircaseCount = Number(form.staircaseCount)
  const isValid = Boolean(form.name.trim())
    && Boolean(form.activeAdminName.trim())
    && Number.isInteger(apartmentCount)
    && apartmentCount >= 0
    && Number.isInteger(residentCount)
    && residentCount >= 0
    && Number.isInteger(staircaseCount)
    && staircaseCount >= 0

  const handleSubmit = async () => {
    if (!isValid) {
      setError(t('settings.blockDialog.validationError'))
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        name: form.name.trim(),
        activeAdminName: form.activeAdminName.trim(),
        apartmentCount,
        residentCount,
        hasStaircases: form.hasStaircases,
        staircaseCount: form.hasStaircases ? staircaseCount : 0,
        address: form.address.trim() || undefined,
      })
    } catch (submitError) {
      setError(submitError instanceof Error
        ? submitError.message
        : t('settings.blockDialog.serverError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppDialog
      cancelLabel={t('common.cancel')}
      confirmDisabled={!isValid || isSubmitting}
      confirmLabel={isSubmitting
        ? t('settings.blockDialog.saving')
        : t(isEditMode ? 'settings.blockDialog.saveEdit' : 'settings.actions.addBlock')}
      contentSx={{ display: 'grid', gap: 2, pt: 1 }}
      maxWidth="md"
      onCancel={onClose}
      onConfirm={() => void handleSubmit()}
      open={open}
      title={t(isEditMode ? 'settings.blockDialog.editTitle' : 'settings.blockDialog.createTitle')}
    >
      {error && <Alert severity="error">{error}</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
        <TextField
          required
          label={t('settings.fields.blockName')}
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
        <TextField
          required
          label={t('settings.blockDialog.administrator')}
          value={form.activeAdminName}
          onChange={(event) => setForm((current) => ({ ...current, activeAdminName: event.target.value }))}
        />
        <TextField
          required
          slotProps={{ htmlInput: { min: 0, step: 1 } }}
          label={t('settings.blockDialog.apartmentsCount')}
          type="number"
          value={form.apartmentCount}
          onChange={(event) => setForm((current) => ({ ...current, apartmentCount: event.target.value }))}
        />
        <TextField
          required
          slotProps={{ htmlInput: { min: 0, step: 1 } }}
          label={t('settings.blockDialog.residentsCount')}
          type="number"
          value={form.residentCount}
          onChange={(event) => setForm((current) => ({ ...current, residentCount: event.target.value }))}
        />
        <FormControlLabel
          control={(
            <Switch
              checked={form.hasStaircases}
              onChange={(event) => setForm((current) => ({
                ...current,
                hasStaircases: event.target.checked,
                staircaseCount: event.target.checked ? current.staircaseCount : '0',
              }))}
            />
          )}
          label={t('settings.blockDialog.hasStaircases')}
        />
        <TextField
          disabled={!form.hasStaircases}
          slotProps={{ htmlInput: { min: 0, step: 1 } }}
          label={t('settings.blockDialog.staircaseCount')}
          type="number"
          value={form.staircaseCount}
          onChange={(event) => setForm((current) => ({ ...current, staircaseCount: event.target.value }))}
        />
      </Box>
      <TextField
        fullWidth
        label={t('settings.blockDialog.address')}
        value={form.address}
        onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
      />
    </AppDialog>
  )
}

export default AddBlockDialog
