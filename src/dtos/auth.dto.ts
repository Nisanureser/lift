import { t } from 'elysia'
import { createInsertSchema } from 'drizzle-typebox'
import { users } from '../database/schema'

// Telefon numarasi validasyon semasi (register ve login icin ortak)
const phoneSchema = t.String({
  minLength: 10,
  maxLength: 20,
  pattern: '^\\+?[0-9]{10,15}$',
})

// Drizzle users tablosundan kayit istegi validasyon semasini uretir
const _insertUser = createInsertSchema(users, {
  email: t.String({ format: 'email' }),
  username: t.String({
    minLength: 3,
    maxLength: 50,
    pattern: '^[a-zA-Z0-9_]+$',
  }),
  password: t.String({ minLength: 8, maxLength: 100 }),
  phone: phoneSchema,
})

// Register endpoint body semasi (hassas alanlar haric)
export const RegisterBody = t.Omit(_insertUser, [
  'id',
  'salt',
  'isActive',
  'createdAt',
  'updatedAt',
])

// Client bos alanlari "" olarak gonderebildigi icin literal empty string kabul edilir
const optionalLoginEmail = t.Optional(
  t.Union([t.Literal(''), t.String({ format: 'email' })]),
)

const optionalLoginPhone = t.Optional(t.Union([t.Literal(''), phoneSchema]))

// Login endpoint body semasi (email veya telefon + sifre)
export const LoginBody = t.Object({
  email: optionalLoginEmail,
  phone: optionalLoginPhone,
  password: t.String({ minLength: 8 }),
})

// Auth yanitlarinda donen guvenli kullanici semasi
export const UserResponse = t.Object({
  id: t.String(),
  username: t.String(),
  email: t.String({ format: 'email' }),
  phone: t.String(),
  isActive: t.Boolean(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
})

// Mobil/API fallback: opsiyonel refresh token body semasi
export const RefreshBody = t.Object({
  refreshToken: t.Optional(t.String({ minLength: 32 })),
})

// Auth cookie semasi
export const AuthCookieSchema = t.Cookie({
  lift_access_token: t.Optional(t.String()),
  lift_refresh_token: t.Optional(t.String()),
})

// Register/login yanit semasi
export const AuthResponse = t.Object({
  user: UserResponse,
})
