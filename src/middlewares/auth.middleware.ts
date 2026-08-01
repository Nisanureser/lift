import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { env } from '../config/env'
import { ERROR_CODES } from '../constants/error-codes'
import { getUserById } from '../services/auth.service'
import { isAccessTokenBlacklisted } from '../services/token.service'
import type { SafeUser } from '../types/auth.types'

// JWT dogrulama plugin'ini yapilandirir ve auth context'ine ekler
export const jwtPlugin = new Elysia({ name: 'jwt-plugin' }).use(
  jwt({
    name: 'jwt',
    secret: env.JWT_SECRET,
    exp: env.JWT_ACCESS_EXPIRES_IN,
  }),
)

// Authorization header'dan Bearer token'i ayiklar
function extractBearerToken(authorization?: string | null): string | null {
  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  const token = authorization.slice(7).trim()
  return token.length > 0 ? token : null
}

// Korunan route'larda JWT dogrular ve oturum acik kullaniciyi context'e ekler
export const authGuard = new Elysia({ name: 'auth-guard' })
  .use(jwtPlugin)
  .resolve({ as: 'scoped' }, async ({ jwt, request, status }) => {
    const token = extractBearerToken(request.headers.get('authorization'))

    if (!token) {
      return status(401, {
        error: 'Missing authorization token',
        code: ERROR_CODES.UNAUTHORIZED,
      })
    }

    const payload = await jwt.verify(token)

    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      return status(401, {
        error: 'Invalid or expired token',
        code: ERROR_CODES.UNAUTHORIZED,
      })
    }

    if ('jti' in payload && payload.jti) {
      const blacklisted = await isAccessTokenBlacklisted(String(payload.jti))

      if (blacklisted) {
        return status(401, {
          error: 'Token has been revoked',
          code: ERROR_CODES.TOKEN_REVOKED,
        })
      }
    }

    const userId = String(payload.userId)
    const user = await getUserById(userId)

    if (!user) {
      return status(401, {
        error: 'User not found or inactive',
        code: ERROR_CODES.UNAUTHORIZED,
      })
    }

    const accessJti = 'jti' in payload && payload.jti ? String(payload.jti) : undefined

    return { user: user satisfies SafeUser, accessJti }
  })
