import { eq } from 'drizzle-orm'
import { ERROR_CODES } from '../constants/error-codes'
import { db } from '../database'
import { users } from '../database/schema'
import type { LoginInput, RegisterInput, SafeUser } from '../types/auth.types'
import { AppError } from '../utils/errors.util'
import { createPasswordHash, verifyPassword } from '../utils/password.util'

// Veritabanindan gelen kullanici kaydini API yanitina uygun guvenli formata cevirir
function toSafeUser(user: typeof users.$inferSelect): SafeUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

// Kayit istegindeki email, telefon ve kullanici adini karsilastirma icin normalize eder
function normalizeRegisterInput(input: RegisterInput): RegisterInput {
  return {
    ...input,
    username: input.username.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim().replace(/\s/g, ''),
  }
}

// Ayni email, telefon veya kullanici adiyla ikinci hesap acilmasini engeller
async function ensureRegisterIdentityAvailable(input: RegisterInput): Promise<void> {
  const [emailMatch, phoneMatch, usernameMatch] = await Promise.all([
    db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1),
    db.select({ id: users.id }).from(users).where(eq(users.phone, input.phone)).limit(1),
    db.select({ id: users.id }).from(users).where(eq(users.username, input.username)).limit(1),
  ])

  if (emailMatch.length > 0) {
    throw new AppError('Email already registered', 409, ERROR_CODES.EMAIL_EXISTS)
  }

  if (phoneMatch.length > 0) {
    throw new AppError('Phone already registered', 409, ERROR_CODES.PHONE_EXISTS)
  }

  if (usernameMatch.length > 0) {
    throw new AppError('Username already registered', 409, ERROR_CODES.USERNAME_EXISTS)
  }
}

// Yeni kullanici kaydi olusturur; email/telefon/kullanici adi tekilligini kontrol eder
export async function registerUser(input: RegisterInput): Promise<SafeUser> {
  const normalized = normalizeRegisterInput(input)

  await ensureRegisterIdentityAvailable(normalized)

  const { hash, salt } = createPasswordHash(normalized.password)

  const [newUser] = await db
    .insert(users)
    .values({
      username: normalized.username,
      email: normalized.email,
      phone: normalized.phone,
      password: hash,
      salt,
    })
    .returning()

  if (!newUser) {
    throw new AppError('Failed to create user', 500, ERROR_CODES.USER_CREATE_FAILED)
  }

  return toSafeUser(newUser)
}

// Login istegindeki email/telefon alanlarini temizler; ikisi de doluysa email'i kullanir
function resolveLoginIdentity(input: LoginInput): { email?: string; phone?: string } {
  const email = input.email?.trim().toLowerCase() || undefined
  const phone = input.phone?.trim().replace(/\s/g, '') || undefined

  if (!email && !phone) {
    throw new AppError('Email or phone is required', 422, ERROR_CODES.VALIDATION_ERROR)
  }

  if (email) {
    return { email }
  }

  return { phone }
}

// Email veya telefon ve sifre ile kullanici dogrular
export async function loginUser(input: LoginInput): Promise<SafeUser> {
  const identity = resolveLoginIdentity(input)

  const [user] = identity.email
    ? await db.select().from(users).where(eq(users.email, identity.email)).limit(1)
    : await db.select().from(users).where(eq(users.phone, identity.phone!)).limit(1)

  if (!user || !user.isActive) {
    throw new AppError('Invalid credentials', 401, ERROR_CODES.INVALID_CREDENTIALS)
  }

  const isValid = verifyPassword(input.password, user.salt, user.password)

  if (!isValid) {
    throw new AppError('Invalid credentials', 401, ERROR_CODES.INVALID_CREDENTIALS)
  }

  return toSafeUser(user)
}

// Aktif kullaniciyi ID ile getirir
export async function getUserById(userId: string): Promise<SafeUser | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  if (!user || !user.isActive) {
    return null
  }

  return toSafeUser(user)
}
