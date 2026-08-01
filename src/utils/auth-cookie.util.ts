import type { Cookie } from 'elysia'
import { env } from '../config/env'
import { parseDurationToSeconds } from '../services/token.service'

export const ACCESS_TOKEN_COOKIE = 'lift_access_token'
export const REFRESH_TOKEN_COOKIE = 'lift_refresh_token'

export type AuthCookieJar = {
  [ACCESS_TOKEN_COOKIE]: Cookie<string | undefined>
  [REFRESH_TOKEN_COOKIE]: Cookie<string | undefined>
}

// httpOnly auth cookie'leri icin ortak guvenlik ayarlarini dondurur
function getAuthCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: '/',
    maxAge,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  }
}

// Login/register/refresh sonrasi access ve refresh token cookie'lerini yazar
export function setAuthCookies(
  cookie: AuthCookieJar,
  accessToken: string,
  refreshToken: string,
): void {
  cookie[ACCESS_TOKEN_COOKIE].set({
    value: accessToken,
    ...getAuthCookieOptions(parseDurationToSeconds(env.JWT_ACCESS_EXPIRES_IN)),
  })

  cookie[REFRESH_TOKEN_COOKIE].set({
    value: refreshToken,
    ...getAuthCookieOptions(parseDurationToSeconds(env.JWT_REFRESH_EXPIRES_IN)),
  })
}

// Logout sonrasi auth cookie'lerini tarayicidan siler
export function clearAuthCookies(cookie: AuthCookieJar): void {
  cookie[ACCESS_TOKEN_COOKIE].remove()
  cookie[REFRESH_TOKEN_COOKIE].remove()
}

// Cookie header'indan belirli bir cookie degerini okur
function readCookieHeader(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) {
    return null
  }

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${escapedName}=([^;]*)`))

  if (!match?.[1]) {
    return null
  }

  const value = decodeURIComponent(match[1].trim())
  return value.length > 0 ? value : null
}

// Cookie jar veya body fallback ile refresh token okur
export function getRefreshToken(cookie: AuthCookieJar, bodyToken?: string): string | null {
  return cookie[REFRESH_TOKEN_COOKIE].value ?? bodyToken ?? null
}

// Cookie jar, Cookie header veya Bearer header'dan access token okur
export function getAccessToken(
  cookieHeader: string | null,
  authorization: string | null,
  cookie?: AuthCookieJar,
): string | null {
  const cookieValue =
    cookie?.[ACCESS_TOKEN_COOKIE]?.value ?? readCookieHeader(cookieHeader, ACCESS_TOKEN_COOKIE)

  if (cookieValue) {
    return cookieValue
  }

  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  const bearerToken = authorization.slice(7).trim()
  return bearerToken.length > 0 ? bearerToken : null
}
