import { isNull, type SQL } from 'drizzle-orm'
import type { AnyColumn } from 'drizzle-orm'

// Silinmemis kayitlari filtrelemek icin deletedAt IS NULL kosulu uretir
export function notDeleted(deletedAtColumn: AnyColumn): SQL {
  return isNull(deletedAtColumn)
}

// Soft delete islemi icin guncellenecek alanlari dondurur
export function softDeleteFields(): { deletedAt: Date; updatedAt: Date } {
  const now = new Date()
  return { deletedAt: now, updatedAt: now }
}
