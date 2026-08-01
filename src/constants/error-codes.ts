// Uygulama genelinde kullanilan hata kod sabitleri
export const ERROR_CODES = {
  USER_EXISTS: 'USER_EXISTS',
  USER_CREATE_FAILED: 'USER_CREATE_FAILED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
