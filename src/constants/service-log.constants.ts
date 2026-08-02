// Servis kaydi sonuc sabitleri
export const SERVICE_LOG_RESULTS = {
  OK: 'ok',
  NEEDS_FOLLOWUP: 'needs_followup',
  CRITICAL: 'critical',
} as const

export type ServiceLogResult = (typeof SERVICE_LOG_RESULTS)[keyof typeof SERVICE_LOG_RESULTS]

// Servis kaydi basina maksimum fotograf sayisi
export const MAX_PHOTOS_PER_SERVICE_LOG = 10
