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

const formatNotificationPeriod = (
  notification: NotificationResponse,
  language: string,
  fallbackMessage: string,
) => {
  if (notification.relatedYear && notification.relatedMonth) {
    return new Intl.DateTimeFormat(language, {
      month: 'long',
      year: 'numeric',
    }).format(new Date(notification.relatedYear, notification.relatedMonth - 1, 1))
  }

  const match = fallbackMessage.match(/for ([A-Za-z]+ \d{4})\./)
  return match?.[1] ?? ''
}

const formatNotificationContext = (
  notification: NotificationResponse,
  t: ReturnType<typeof useTranslation>['t'],
) => {
  if (!['WaterReadingDeadlinePassed', 'WaterReadingAddedByAdmin', 'WaterReadingReminder'].includes(notification.type) || !notification.context) {
    return notification.context
  }

  const staircaseMatch = notification.context.match(/^Block (.*), Staircase (.*), Apartment (.*)$/)
  if (staircaseMatch) {
    return t('notifications.types.waterReadingDeadlinePassed.contextWithStaircase', {
      apartment: staircaseMatch[3],
      block: staircaseMatch[1],
      staircase: staircaseMatch[2],
    })
  }

  const apartmentMatch = notification.context.match(/^Block (.*), Apartment (.*)$/)
  if (apartmentMatch) {
    return t('notifications.types.waterReadingDeadlinePassed.context', {
      apartment: apartmentMatch[2],
      block: apartmentMatch[1],
    })
  }

  return notification.context
}

const getNotificationDisplay = (
  notification: NotificationResponse,
  t: ReturnType<typeof useTranslation>['t'],
  language: string,
) => {
  const waterType = notification.type === 'WaterReadingAddedByAdmin' ? 'waterReadingAddedByAdmin'
    : notification.type === 'WaterReadingReminder' ? 'waterReadingReminder' : null
  if (waterType) return {
    context: formatNotificationContext(notification, t),
    message: t(`notifications.types.${waterType}.message`, { period: formatNotificationPeriod(notification, language, notification.message) }),
    title: t(`notifications.types.${waterType}.title`),
  }
  if (notification.type !== 'WaterReadingDeadlinePassed') {
    return {
      context: notification.context,
      message: notification.message,
      title: notification.title,
    }
  }

  const period = formatNotificationPeriod(notification, language, notification.message)
  const residentName = notification.message.match(/^(.*) has not submitted the water index for /)?.[1]

  return {
    context: formatNotificationContext(notification, t),
    message: residentName
      ? t('notifications.types.waterReadingDeadlinePassed.adminMessage', { period, resident: residentName })
      : t('notifications.types.waterReadingDeadlinePassed.residentMessage', { period }),
    title: t('notifications.types.waterReadingDeadlinePassed.title'),
  }
}

const NotificationListItem: React.FC<Props> = ({ notification, onClick }) => {
  const { i18n, t } = useTranslation()
  const display = getNotificationDisplay(notification, t, i18n.language)

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
          {display.title}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {display.message}
        </Typography>
        {display.context && (
          <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="caption">
            {display.context}
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
