import type { SafeUser } from '../types/auth.types'
import { loginUser, registerUser } from '../services/auth.service'
import { issueTokenPair, revokeSession, rotateTokenPair } from '../services/token.service'
import {
  type AuthCookieJar,
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
} from '../utils/auth-cookie.util'
import { runController } from '../utils/controller.util'
import { AppError } from '../utils/errors.util'
import { ERROR_CODES } from '../constants/error-codes'

type JwtSigner = {
  sign: (payload: Record<string, string>) => Promise<string>
  verify: (token: string) => Promise<unknown>
}

type AuthHandlerContext = {
  jwt: JwtSigner
  set: { status?: number | string }
  cookie: AuthCookieJar
}

// Yeni kullanici kaydi HTTP handler'i
export async function register({
  body,
  jwt,
  set,
  cookie,
}: AuthHandlerContext & {
  body: Parameters<typeof registerUser>[0]
}) {
  return runController(set, async () => {
    const user = await registerUser(body)
    const tokens = await issueTokenPair(user, jwt)

    setAuthCookies(cookie, tokens.accessToken, tokens.refreshToken)

    set.status = 201
    return { user }
  })
}

// Kullanici girisi HTTP handler'i
export async function login({
  body,
  jwt,
  set,
  cookie,
}: AuthHandlerContext & {
  body: Parameters<typeof loginUser>[0]
}) {
  return runController(set, async () => {
    const user = await loginUser(body)
    const tokens = await issueTokenPair(user, jwt)

    setAuthCookies(cookie, tokens.accessToken, tokens.refreshToken)

    set.status = 200
    return { user }
  })
}

// Refresh token cookie'si ile yeni token cifti uretir
export async function refresh({
  body,
  jwt,
  set,
  cookie,
}: AuthHandlerContext & {
  body: { refreshToken?: string }
}) {
  return runController(set, async () => {
    const refreshToken = getRefreshToken(cookie, body.refreshToken)

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 401, ERROR_CODES.REFRESH_TOKEN_INVALID)
    }

    const tokens = await rotateTokenPair(refreshToken, jwt)

    setAuthCookies(cookie, tokens.accessToken, tokens.refreshToken)

    set.status = 200
    return { message: 'Session refreshed' }
  })
}

// Oturum acik kullanicinin profil bilgisini dondurur
export function me({ user }: { user: SafeUser }) {
  return { user }
}

// Cikis yaparak refresh token'i iptal eder, access token'i blacklist'e alir ve cookie'leri siler
export async function logout({
  body,
  set,
  cookie,
  request,
  jwt,
}: {
  body: { refreshToken?: string }
  set: { status?: number | string }
  cookie: AuthCookieJar
  request: Request
  jwt: JwtSigner
}) {
  return runController(set, async () => {
    const accessToken = getAccessToken(
      request.headers.get('cookie'),
      request.headers.get('authorization'),
    )

    let accessJti: string | undefined

    if (accessToken) {
      const payload = await jwt.verify(accessToken)

      if (payload && typeof payload === 'object' && 'jti' in payload && payload.jti) {
        accessJti = String(payload.jti)
      }
    }

    const refreshToken = getRefreshToken(cookie, body.refreshToken)

    if (refreshToken) {
      await revokeSession(refreshToken, accessJti)
    }

    clearAuthCookies(cookie)
    return { message: 'Logged out successfully' }
  })
}
