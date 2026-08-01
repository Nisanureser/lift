import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { env } from '../config/env'
import { ERROR_CODES } from '../constants/error-codes'
import { getUserById } from '../services/auth.service'
import type { SafeUser } from '../types/auth.types'
import { AppError } from '../utils/errors.util'

// JWT dogrulama plugin'ini yapilandirir ve auth context'ine ekler
export const jwtPlugin = new Elysia({ name: 'jwt-plugin' }).use(
  jwt({
    name: 'jwt',
    secret: env.JWT_SECRET,
    exp: env.JWT_EXPIRES_IN,
  }),
)

// Authorization header'dan Bearer token'i ayiklar
function extractBearerToken(authorization?: string): string | null {
  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  const token = authorization.slice(7).trim()
  return token.length > 0 ? token : null
}

// Korunan route'larda JWT dogrular ve oturum acik kullaniciyi context'e ekler
export const authGuard = new Elysia({ name: 'auth-guard' })
  .use(jwtPlugin)
  .derive({ as: 'scoped' }, async ({ jwt, request }) => {
    const token = extractBearerToken(request.headers.get('authorization') ?? undefined)

    if (!token) {
      throw new AppError('Missing authorization token', 401, ERROR_CODES.UNAUTHORIZED)
    }

    const payload = await jwt.verify(token)

    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      throw new AppError('Invalid or expired token', 401, ERROR_CODES.UNAUTHORIZED)
    }

    const userId = String(payload.userId)
    const user = await getUserById(userId)

    if (!user) {
      throw new AppError('User not found or inactive', 401, ERROR_CODES.UNAUTHORIZED)
    }

    return { user: user satisfies SafeUser }
  })
