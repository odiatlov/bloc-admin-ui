import React from 'react'
import Box from '@mui/material/Box'
import ListItemButton from '@mui/material/ListItemButton'
import Typography from '@mui/material/Typography'
import CircleIcon from '@mui/icons-material/Circle'
import { useTranslation } from 'react-i18next'
import type { NotificationResponse } from '../../types/notifications'
import { formatFriendlyDateTime } from '../../utils/formatters'

type Props = {
  notification: NotificationResponse
  onClick: (notification: NotificationResponse) => void
}

const NotificationListItem: React.FC<Props> = ({ notification, onClick }) => {
  const { t } = useTranslation()

  return (
    <ListItemButton
      alignItems="flex-start"
      onClick={() => onClick(notification)}
      sx={{
        borderLeft: 3,
        borderColor: notification.isRead ? 'transparent' : 'primary.main',
        gap: 1.5,
        py: 1.5,
      }}
    >
      <Box sx={{ pt: 0.8, width: 12 }}>
        {!notification.isRead && <CircleIcon color="primary" sx={{ fontSize: 8 }} />}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: notification.isRead ? 500 : 700 }} variant="subtitle2">
          {notification.title}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {notification.message}
        </Typography>
        {notification.context && (
          <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="caption">
            {notification.context}
          </Typography>
        )}
        <Typography color="text.secondary" sx={{ display: 'block', mt: 0.75 }} variant="caption">
          {formatFriendlyDateTime(notification.createdAt, {
            atLabel: t('common.at'),
            todayLabel: t('common.today'),
          }) || t('notifications.unknownDate')}
        </Typography>
      </Box>
    </ListItemButton>
  )
}

export default NotificationListItem
