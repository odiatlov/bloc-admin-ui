import React from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import AppDialog from '../../../../components/shared/AppDialog'
import { blocksApi } from '../../../../services/blocksApi'
import type { BlockDeletionSummary } from '../../../../types/block'

type Props = {
  blockId: string
  isDeleting: boolean
  onCancel: () => void
  onDelete: (summary: BlockDeletionSummary) => Promise<boolean>
}

const BlockDeletionDialog: React.FC<Props> = ({ blockId, isDeleting, onCancel, onDelete }) => {
  const { t } = useTranslation()
  const [summary, setSummary] = React.useState<BlockDeletionSummary | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [hasError, setHasError] = React.useState(false)
  const [isFinalConfirmation, setIsFinalConfirmation] = React.useState(false)
  const [reload, setReload] = React.useState(0)

  React.useEffect(() => {
    let active = true
    blocksApi.getDeletionSummary(blockId).then((result) => {
      if (active) setSummary(result)
    }).catch(() => {
      if (active) setHasError(true)
    }).finally(() => {
      if (active) setIsLoading(false)
    })
    return () => { active = false }
  }, [blockId, reload])

  const retry = () => {
    setSummary(null)
    setHasError(false)
    setIsLoading(true)
    setIsFinalConfirmation(false)
    setReload((value) => value + 1)
  }

  const confirm = async () => {
    if (!summary || isLoading || hasError || isDeleting) return
    if (!isFinalConfirmation) {
      setIsFinalConfirmation(true)
      return
    }
    if (!await onDelete(summary)) retry()
  }

  const counts = summary ? [
    ['staircases', summary.staircaseCount],
    ['apartments', summary.apartmentCount],
    ['waterMeters', summary.waterMeterCount],
    ['waterReadings', summary.waterReadingCount],
  ] as const : []

  return (
    <AppDialog
      open
      maxWidth="xs"
      title={t('settings.blockDialog.deleteTitle')}
      cancelLabel={t('common.cancel')}
      confirmLabel={isDeleting ? t('settings.blockDialog.deleting') : t(isFinalConfirmation ? 'blocks.deletion.deleteAll' : 'blocks.deletion.delete')}
      confirmColor="error"
      confirmDisabled={!summary || isLoading || hasError || isDeleting}
      onCancel={() => { if (!isDeleting) onCancel() }}
      onConfirm={() => void confirm()}
    >
      <Box sx={{ display: 'grid', gap: 2 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CircularProgress size={24} />
            <Typography>{t('blocks.deletion.loading')}</Typography>
          </Box>
        ) : hasError ? (
          <Alert severity="error" action={<Button color="inherit" onClick={retry}>{t('blocks.actions.retry')}</Button>}>
            {t('blocks.deletion.loadFailed')}
          </Alert>
        ) : summary && (
          <>
            <Typography>{t('blocks.deletion.summary', { block: summary.blockName })}</Typography>
            <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 1 }}>
              {counts.map(([label, count]) => (
                <React.Fragment key={label}>
                  <Typography component="dt">{t(`blocks.deletion.${label}`)}</Typography>
                  <Typography component="dd" sx={{ m: 0, fontWeight: 600 }}>{count}</Typography>
                </React.Fragment>
              ))}
            </Box>
            <Typography>{t('blocks.deletion.residentsPreserved')}</Typography>
            {isFinalConfirmation && <Alert severity="warning">{t('blocks.deletion.irreversible')}</Alert>}
          </>
        )}
      </Box>
    </AppDialog>
  )
}

export default BlockDeletionDialog
