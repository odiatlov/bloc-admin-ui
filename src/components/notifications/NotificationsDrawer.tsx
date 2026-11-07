import React from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import IconButtonTooltip from '../shared/IconButtonTooltip'
import List from '@mui/material/List'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../shared/EmptyState'
import LoadErrorState from '../shared/LoadErrorState'
import type { NotificationResponse } from '../../types/notifications'
import NotificationListItem from './NotificationListItem'
import { RoleContext } from '../../contexts/RoleContext'
import { useFinanceActionScope } from '../../hooks/useFinanceWorkspace'

type Props = {
  error: string | null
  loading: boolean
  notifications: NotificationResponse[]
  onClose: () => void
  onMarkAllAsRead: () => Promise<void>
  onNotificationClick: (notification: NotificationResponse) => Promise<void>
  onRetry: () => void
  open: boolean
}

const NotificationsDrawer: React.FC<Props> = ({
  error,
  loading,
  notifications,
  onClose,
  onMarkAllAsRead,
  onNotificationClick,
  onRetry,
  open,
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const active = useFinanceActionScope()
  const { account, setRole } = React.useContext(RoleContext)
  const unreadCount = notifications.filter((notification) => !notification.isRead).length

  const handleClick = async (notification: NotificationResponse) => {
    try { await onNotificationClick(notification) } catch { return }
    if (!active.current) return
    if (notification.actionUrl) {
      if (notification.type.startsWith('FinanceReview')) {
        const targetRole = notification.type === 'FinanceReviewSubmitted' || notification.type === 'FinanceReviewResubmitted' ? 'Censor' : 'Admin'
        if (account.roles.includes(targetRole)) setRole(targetRole)
      }
      if (notification.type === 'BillCashRequested' && account.roles.includes('Admin')) setRole('Admin')
      if ((notification.type === 'BillPaymentReminder' || notification.type === 'BillCorrectionPublished')
        && account.roles.includes('Resident')) setRole('Resident')
      navigate(notification.actionUrl)
      onClose()
    }
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: { xs: 320, sm: 420 } }}>
        <Toolbar sx={{ gap: 1 }}>
          <Typography sx={{ flex: 1, fontWeight: 700 }} variant="h6">
            {t('notifications.title')}
          </Typography>
          <IconButtonTooltip title={t('common.close')}>
          <IconButton aria-label={t('common.close')} onClick={onClose}>
            <CloseIcon />
          </IconButton>
          </IconButtonTooltip>
        </Toolbar>
        <Divider />
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 1, px: 2, py: 1.5 }}>
          <Typography color="text.secondary" sx={{ flex: 1 }} variant="body2">
            {t('notifications.unreadCount', { count: unreadCount })}
          </Typography>
          <Button
            disabled={unreadCount === 0 || loading}
            onClick={() => void onMarkAllAsRead()}
            size="small"
            startIcon={<DoneAllIcon />}
          >
            {t('notifications.markAllAsRead')}
          </Button>
        </Box>
        <Divider />
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {loading && (
            <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          )}
          {!loading && error && (
            <Box sx={{ p: 2 }}>
              <LoadErrorState helperText={error} onRetry={onRetry} />
            </Box>
          )}
          {!loading && !error && notifications.length === 0 && (
            <Box sx={{ p: 2 }}>
              <EmptyState
                actionLabel={t('common.refresh')}
                headline={t('notifications.empty.headline')}
                helperText={t('notifications.empty.helperText')}
                onAction={onRetry}
              />
            </Box>
          )}
          {!loading && !error && notifications.length > 0 && (
            <List disablePadding>
              {notifications.map((notification) => (
                <React.Fragment key={notification.id}>
                  <NotificationListItem notification={notification} onClick={(item) => void handleClick(item)} />
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
        {error && (
          <Alert severity="warning" sx={{ borderRadius: 0 }}>
            {t('notifications.realDataOnly')}
          </Alert>
        )}
      </Box>
    </Drawer>
  )
}

export default NotificationsDrawer
