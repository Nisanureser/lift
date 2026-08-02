import { ERROR_CODES } from '../constants/error-codes'

/** Postgres / Drizzle baglanti hatalarini tespit eder. */
export function isDatabaseConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes('failed query') ||
    message.includes('connect') ||
    message.includes('econnrefused') ||
    message.includes('timeout') ||
    message.includes('password authentication failed')
  )
}

/** Veritabani baglanti hatasi icin standart API yaniti uretir. */
export function databaseUnavailableResponse(): {
  status: number
  body: { error: string; code: string }
} {
  return {
    status: 503,
    body: {
      error:
        'Veritabani baglantisi kurulamadi. PostgreSQL calistigini ve DATABASE_URL degerini kontrol et.',
      code: ERROR_CODES.DB_UNAVAILABLE,
    },
  }
}
