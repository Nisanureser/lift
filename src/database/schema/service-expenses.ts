import { numeric, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { serviceLogs } from './service-logs'

// Servis kaydina bagli diger masraf satirlarini (otopark, tasima vb.) tutar
export const serviceExpenses = pgTable('service_expenses', {
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId())
    .primaryKey(),
  serviceLogId: varchar('service_log_id', { length: 128 })
    .notNull()
    .references(() => serviceLogs.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 200 }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
