import { numeric, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { orders } from './orders'
import { users } from './users'

/** Vadeli siparislerde kismi odeme kayitlarini tutar. */
export const orderPayments = pgTable('order_payments', {
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId())
    .primaryKey(),
  orderId: varchar('order_id', { length: 128 })
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  note: text('note'),
  createdBy: varchar('created_by', { length: 128 }).references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
