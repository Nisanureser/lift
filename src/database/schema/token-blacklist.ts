import { pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'

// Logout sonrasi gecersiz kilinan access token jti kayitlari
export const tokenBlacklist = pgTable('token_blacklist', {
  jti: varchar('jti', { length: 128 }).primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
