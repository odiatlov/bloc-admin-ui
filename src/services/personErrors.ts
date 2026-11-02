import type { TFunction } from 'i18next'

const personValidationKeys: Record<string, string> = {
  'Review the current censor assignments and select distinct managed blocks.': 'reviewCensors',
  'The person is not available for this admin.': 'scope',
  'One or more persons are not available for this admin.': 'scope',
  'One or more blocks are not available for this admin.': 'scope',
  'Censor assignments changed. Reopen the editor and review them again.': 'censorsChanged',
  'An active person and an active linked account are required for censor access.': 'activeCensorAccount',
  'The administrator cannot be the censor of the same block.': 'selfCensor',
  'A selected block already has a censor. Remove that assignment explicitly first.': 'occupiedCensor',
  'Remove censor assignments before removing the person from your records.': 'removeCensorsFirst',
}

export const personErrorMessage = (error: unknown, t: TFunction, fallback: string) => {
  if (!(error instanceof Error)) return t(fallback)
  const key = personValidationKeys[error.message]
  return key ? t('persons.errors.' + key) : error.message
}
