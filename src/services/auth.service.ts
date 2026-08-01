import { eq, or } from 'drizzle-orm'
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

// Yeni kullanici kaydi olusturur; email/username cakismasinda hata firlatir
export async function registerUser(input: RegisterInput): Promise<SafeUser> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(
      or(
        eq(users.email, input.email),
        eq(users.username, input.username),
        eq(users.phone, input.phone),
      ),
    )
    .limit(1)

  if (existing.length > 0) {
    throw new AppError('Email, username or phone already registered', 409, ERROR_CODES.USER_EXISTS)
  }

  const { hash, salt } = createPasswordHash(input.password)

  const [newUser] = await db
    .insert(users)
    .values({
      username: input.username,
      email: input.email,
      phone: input.phone,
      password: hash,
      salt,
    })
    .returning()

  if (!newUser) {
    throw new AppError('Failed to create user', 500, ERROR_CODES.USER_CREATE_FAILED)
  }

  return toSafeUser(newUser)
}

// Email ve sifre ile kullanici dogrular; basarisiz girislerde genel hata mesaji doner
export async function loginUser(input: LoginInput): Promise<SafeUser> {
  const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1)

  if (!user || !user.isActive) {
    throw new AppError('Invalid credentials', 401, ERROR_CODES.INVALID_CREDENTIALS)
  }

  const isValid = verifyPassword(input.password, user.salt, user.password)

  if (!isValid) {
    throw new AppError('Invalid credentials', 401, ERROR_CODES.INVALID_CREDENTIALS)
  }

  return toSafeUser(user)
}

// JWT icin kullanilacak payload bilgisini kullanici ID'sinden uretir
export async function getUserById(userId: string): Promise<SafeUser | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  if (!user || !user.isActive) {
    return null
  }

  return toSafeUser(user)
}
