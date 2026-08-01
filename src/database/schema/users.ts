import { boolean, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

// Kullanici hesap bilgilerini ve kimlik dogrulama alanlarini tutar
export const users = pgTable('users', {
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId())
    .primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  salt: varchar('salt', { length: 64 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
