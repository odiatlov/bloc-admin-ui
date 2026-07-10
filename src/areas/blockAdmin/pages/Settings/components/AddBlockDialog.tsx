import React from 'react'
import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'
import { useTranslation } from 'react-i18next'
import AppDialog from '../../../../../components/shared/AppDialog'
import type {
  BlockOverviewDto,
  CreateBlockRequest,
} from '../../../../../types/block'

type AddBlockDialogProps = {
  block?: BlockOverviewDto | null
  open: boolean
  onClose: () => void
  onSubmit: (request: CreateBlockRequest) => Promise<void>
}

type BlockForm = {
  name: string
  address: string
}

const emptyForm: BlockForm = {
  name: '',
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
      address: block.address ?? '',
    } : emptyForm)
    setError(null)
  }, [block, open])

  const isValid = Boolean(form.name.trim())

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
        activeAdminName: '',
        apartmentCount: block?.apartmentCount ?? 0,
        residentCount: block?.residentCount ?? 0,
        hasStaircases: block?.hasStaircases ?? false,
        staircaseCount: block?.staircaseCount ?? 0,
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
      <TextField
        required
        fullWidth
        label={t('settings.fields.blockName')}
        value={form.name}
        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
      />
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
