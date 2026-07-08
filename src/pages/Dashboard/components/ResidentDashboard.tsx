import React from 'react'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import PaymentIcon from '@mui/icons-material/Payment'
import OpacityIcon from '@mui/icons-material/Opacity'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import EmptyState from '../../../components/shared/EmptyState'
import LoadErrorState from '../../../components/shared/LoadErrorState'
import { RoleContext } from '../../../contexts/RoleContext'
import { blocksApi } from '../../../services/blocksApi'
import { residentsApi } from '../../../services/residentsApi'
import { formatCurrency, formatMonth, formatNumber, useResidentPortal, type WaterReadingRow } from '../../../hooks/useApartmentData'
import type { BlockOverview } from '../../../types/block'
import type { ResidentApartmentSummary, ResidentResponse } from '../../../types/management'
import { ActionBar, ContentCard, DashboardHeader, DashboardPage, StatCard, StatGrid } from './DashboardSystem'

const ResidentDashboard: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { account } = React.useContext(RoleContext)
  const { currentBalance, resident, residentInvoices, residentReadings } = useResidentPortal()
  const [databaseResident, setDatabaseResident] = React.useState<ResidentResponse | null>(null)
  const [databaseBlocks, setDatabaseBlocks] = React.useState<BlockOverview[]>([])
  const [isApartmentsLoading, setIsApartmentsLoading] = React.useState(Boolean(account.residentId))
  const [apartmentsError, setApartmentsError] = React.useState<string | null>(null)
  const lastIndex = residentReadings.length ? residentReadings[0] : null
  const renderMeterTotal = (meter: WaterReadingRow['meters']['cold']) =>
    meter ? formatNumber(meter.usageValue) : t('common.notAvailable')
  const announcements = [
    { id: 'A1', date: '2026-05-01', textKey: 'dashboard.resident.announcements.elevator' },
    { id: 'A2', date: '2026-04-20', textKey: 'dashboard.resident.announcements.water' },
  ]

  const loadResidentApartments = React.useCallback(async () => {
    if (!account.residentId) {
      setDatabaseResident(null)
      setDatabaseBlocks([])
      setApartmentsError(null)
      setIsApartmentsLoading(false)
      return
    }

    setIsApartmentsLoading(true)
    setApartmentsError(null)

    try {
      const [nextResident, nextBlocks] = await Promise.all([
        residentsApi.getById(account.residentId),
        blocksApi.getOverview(),
      ])
      setDatabaseResident(nextResident)
      setDatabaseBlocks(nextBlocks)
    } catch (nextError) {
      setApartmentsError(nextError instanceof Error ? nextError.message : 'Unable to load apartments')
    } finally {
      setIsApartmentsLoading(false)
    }
  }, [account.residentId])

  React.useEffect(() => {
    void loadResidentApartments()
  }, [loadResidentApartments])

  const blocksById = React.useMemo(
    () => new Map(databaseBlocks.map((block) => [block.id, block])),
    [databaseBlocks],
  )

  const apartmentsByBlock = React.useMemo(
    () =>
      (databaseResident?.apartments ?? []).reduce<Record<string, ResidentApartmentSummary[]>>((acc, apartment) => {
        acc[apartment.blockId] = [...(acc[apartment.blockId] ?? []), apartment]
        return acc
      }, {}),
    [databaseResident],
  )

  const renderApartmentsPanel = () => {
    if (isApartmentsLoading) {
      return (
        <Paper sx={{ alignItems: 'center', display: 'grid', gap: 1.5, justifyItems: 'center', mt: 1.5, p: 4 }}>
          <CircularProgress size={32} />
          <Typography color="text.secondary">{t('dashboard.resident.apartmentsLoading')}</Typography>
        </Paper>
      )
    }

    if (apartmentsError) {
      return (
        <Box sx={{ mt: 1.5 }}>
          <LoadErrorState helperText={t('dashboard.resident.apartmentsLoadFailed')} onRetry={() => { void loadResidentApartments() }} />
        </Box>
      )
    }

    if (!databaseResident || databaseResident.apartments.length === 0) {
      return (
        <Box sx={{ mt: 1.5 }}>
          <EmptyState
            actionLabel={t('loadErrorState.retry')}
            headline={t('dashboard.resident.noApartmentsHeadline')}
            helperText={t('dashboard.resident.noApartmentsHelper')}
            onAction={() => { void loadResidentApartments() }}
          />
        </Box>
      )
    }

    return (
      <Box sx={{ display: 'grid', gap: 1.25, mt: 1.5 }}>
        {Object.entries(apartmentsByBlock).map(([blockId, apartments]) => {
          const block = blocksById.get(blockId)
          const administratorName = block?.administratorName?.trim()
          const rawBlockLabel = block?.displayName ?? apartments[0]?.blockName ?? blockId
          const blockLabel = /^block\b/i.test(rawBlockLabel)
            ? rawBlockLabel
            : t('common.blockValue', { block: rawBlockLabel })
          return (
            <Box key={blockId} sx={{ display: 'grid', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography>{blockLabel}</Typography>
                {administratorName && (
                  <Chip
                    size="small"
                    label={administratorName}
                    sx={{
                      maxWidth: '100%',
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(129, 140, 248, 0.18)' : 'rgba(79, 70, 229, 0.08)',
                      border: '1px solid',
                      borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(129, 140, 248, 0.32)' : 'rgba(79, 70, 229, 0.18)',
                      color: 'text.primary',
                      '& .MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      },
                    }}
                  />
                )}
              </Box>
              <Box sx={{ display: 'grid', gap: 1 }}>
                {apartments.map((apartment) => (
                  <Box key={apartment.linkId} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography sx={{ fontWeight: 500 }}>
                      {t('dashboard.resident.apartmentTitle', { number: apartment.apartmentNumber, resident: databaseResident.fullName })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                      {[
                        apartment.staircaseName ? t('dashboard.resident.staircaseValue', { staircase: apartment.staircaseName }) : null,
                        t('residents.ownership.owner'),
                      ].filter(Boolean).join(' | ')}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )
        })}
      </Box>
    )
  }

  return (
    <DashboardPage>
      <DashboardHeader title={t('dashboard.resident.title')} context={resident.name} />

      <ActionBar title={t('dashboard.resident.quickActions')}>
        {residentInvoices.length > 0 && (
          <Button startIcon={<PaymentIcon />} variant="contained" onClick={() => navigate('/admin/finance')}>
            {t('dashboard.resident.pay')}
          </Button>
        )}
        <Button startIcon={<OpacityIcon />} variant="outlined" onClick={() => navigate('/admin/consumption')}>
          {t('consumption.actions.submitIndex')}
        </Button>
      </ActionBar>

      <StatGrid columns={{ xs: 'repeat(2, minmax(0, 1fr))' }}>
        <StatCard
          label={t('dashboard.resident.currentDue')}
          value={formatCurrency(currentBalance)}
          secondary={t('dashboard.resident.currentDueSubtitle')}
        />

        <StatCard label={t('dashboard.resident.lastSubmittedIndex')}>
          {lastIndex ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) minmax(180px, 0.9fr)' },
                gap: 2,
                alignItems: 'start',
              }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '1.875rem' }, fontWeight: 700, lineHeight: 1.12 }}>
                  {formatNumber(lastIndex.usageValue)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('consumption.columns.totalUsage')} - {formatMonth(lastIndex.month)}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'grid',
                  gap: 0.5,
                  pl: { sm: 2 },
                  pt: { xs: 1, sm: 0 },
                  borderLeft: { sm: '1px solid' },
                  borderTop: { xs: '1px solid', sm: 'none' },
                  borderColor: 'divider',
                }}
              >
                {[
                  { label: t('dashboard.resident.coldWaterTotal'), value: renderMeterTotal(lastIndex.meters.cold) },
                  { label: t('dashboard.resident.hotWaterTotal'), value: renderMeterTotal(lastIndex.meters.hot) },
                ].map((item) => (
                  <Typography key={item.label} variant="body2" color="text.secondary">
                    {item.label}: <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{item.value}</Box>
                  </Typography>
                ))}
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary">{t('dashboard.resident.noIndex')}</Typography>
          )}
        </StatCard>
      </StatGrid>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
          alignItems: 'stretch',
        }}
      >
        <ContentCard title={t('dashboard.resident.myApartments')}>
          {renderApartmentsPanel()}
        </ContentCard>

        <ContentCard title={t('dashboard.resident.recentAnnouncements')}>
          <List>
            {announcements.length ? (
              announcements.map((item) => (
                <React.Fragment key={item.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemText primary={t(item.textKey)} secondary={new Date(item.date).toLocaleDateString()} />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))
            ) : (
              <ListItem>
                <ListItemText primary={t('dashboard.resident.noAnnouncements')} />
              </ListItem>
            )}
          </List>
        </ContentCard>
      </Box>
    </DashboardPage>
  )
}

export default ResidentDashboard
