import { AppError } from './errors.util'
import { databaseUnavailableResponse, isDatabaseConnectionError } from './db-error.util'

// Controller icinde service hatalarini dogru HTTP status ile dondurur
export async function runController<T>(
  set: { status?: number | string },
  handler: () => Promise<T>,
): Promise<T | { error: string; code?: string }> {
  try {
    return await handler()
  } catch (error) {
    if (error instanceof AppError) {
      set.status = error.statusCode
      return {
        error: error.message,
        ...(error.code ? { code: error.code } : {}),
      }
    }

    if (isDatabaseConnectionError(error)) {
      const { status, body } = databaseUnavailableResponse()
      set.status = status
      return body
    }

    throw error
  }
}
