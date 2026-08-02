import { ERROR_CODES } from '../constants/error-codes'

/** Bilinmeyen hata nesnesinden mesaj metnini cikarir. */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message)
  }

  return ''
}

/** Postgres / Drizzle baglanti ve sema hatalarini tespit eder. */
export function isDatabaseConnectionError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase()

  if (!message) {
    return false
  }

  return (
    message.includes('failed query') ||
    message.includes('connect') ||
    message.includes('econnrefused') ||
    message.includes('timeout') ||
    message.includes('password authentication failed') ||
    message.includes('does not exist') ||
    message.includes('relation') ||
    message.includes('database') ||
    message.includes('postgres')
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
        'Veritabani baglantisi kurulamadi veya tablolar eksik. PostgreSQL calistigini, DATABASE_URL degerini ve db:push komutunu kontrol et.',
      code: ERROR_CODES.DB_UNAVAILABLE,
    },
  }
}
