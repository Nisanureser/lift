import { createHash, randomBytes, randomUUID } from 'crypto'
import { and, eq, isNull, lt } from 'drizzle-orm'
import { env } from '../config/env'
import { ERROR_CODES } from '../constants/error-codes'
import { db } from '../database'
import { refreshTokens, tokenBlacklist } from '../database/schema'
import type { SafeUser } from '../types/auth.types'
import { AppError } from '../utils/errors.util'
import { getUserById } from './auth.service'

type JwtSigner = {
  sign: (payload: Record<string, string>) => Promise<string>
}

export type TokenPair = {
  accessToken: string
  refreshToken: string
}

// Refresh token suresini milisaniyeye cevirir (7d, 15m gibi)
function parseDurationToMs(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/)
  if (!match) return 7 * 24 * 60 * 60 * 1000

  const value = Number(match[1])
  const unit = match[2]

  switch (unit) {
    case 's':
      return value * 1000
    case 'm':
      return value * 60 * 1000
    case 'h':
      return value * 60 * 60 * 1000
    case 'd':
      return value * 24 * 60 * 60 * 1000
    default:
      return 7 * 24 * 60 * 60 * 1000
  }
}

// Cookie maxAge icin sure string'ini saniyeye cevirir
export function parseDurationToSeconds(duration: string): number {
  return Math.floor(parseDurationToMs(duration) / 1000)
}

// Token'i DB'de guvenli saklamak icin SHA-256 hash uretir
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

// Yeni refresh token uretir (JWT degil, opaque string)
export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url')
}

// Access + refresh token cifti olusturur ve refresh token'i DB'ye yazar
export async function issueTokenPair(user: SafeUser, jwt: JwtSigner): Promise<TokenPair> {
  const jti = randomUUID()
  const accessToken = await jwt.sign({
    userId: user.id,
    email: user.email,
    username: user.username,
    jti,
  })

  const refreshToken = generateRefreshToken()
  const refreshExpiresMs = parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN)

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + refreshExpiresMs),
  })

  return { accessToken, refreshToken }
}

// Gecerli refresh token ile yeni token cifti uretir (token rotation)
export async function rotateTokenPair(refreshToken: string, jwt: JwtSigner): Promise<TokenPair> {
  const tokenHash = hashToken(refreshToken)

  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt)))
    .limit(1)

  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError('Invalid or expired refresh token', 401, ERROR_CODES.REFRESH_TOKEN_INVALID)
  }

  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, stored.id))

  const user = await getUserById(stored.userId)

  if (!user) {
    throw new AppError('Invalid or expired refresh token', 401, ERROR_CODES.REFRESH_TOKEN_INVALID)
  }

  return issueTokenPair(user, jwt)
}

// Logout: refresh token'i iptal eder ve access token jti'sini blacklist'e ekler
export async function revokeSession(refreshToken: string, accessJti?: string): Promise<void> {
  const tokenHash = hashToken(refreshToken)

  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt)))

  if (accessJti) {
    const accessExpiresMs = parseDurationToMs(env.JWT_ACCESS_EXPIRES_IN)

    await db
      .insert(tokenBlacklist)
      .values({
        jti: accessJti,
        expiresAt: new Date(Date.now() + accessExpiresMs),
      })
      .onConflictDoNothing()
  }
}

// Access token blacklist kontrolu yapar
export async function isAccessTokenBlacklisted(jti: string): Promise<boolean> {
  const [entry] = await db.select().from(tokenBlacklist).where(eq(tokenBlacklist.jti, jti)).limit(1)

  if (!entry) {
    return false
  }

  if (entry.expiresAt < new Date()) {
    await db.delete(tokenBlacklist).where(eq(tokenBlacklist.jti, jti))
    return false
  }

  return true
}

// Suresi dolmus blacklist kayitlarini temizler
export async function cleanupExpiredBlacklist(): Promise<void> {
  await db.delete(tokenBlacklist).where(lt(tokenBlacklist.expiresAt, new Date()))
}
