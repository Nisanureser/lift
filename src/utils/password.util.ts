import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

// Sifreyi rastgele salt ile scrypt kullanarak hashler
export function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex')
}

// Yeni kullanici kaydi icin salt uretir ve hashlenmis sifreyi dondurur
export function createPasswordHash(password: string): { hash: string; salt: string } {
  const salt = randomBytes(32).toString('hex')
  const hash = hashPassword(password, salt)
  return { hash, salt }
}

// Girilen sifreyi veritabanindaki hash ile zamanlama saldirilarina karsi guvenli karsilastirir
export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const hash = hashPassword(password, salt)

  try {
    return timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash))
  } catch {
    return false
  }
}
