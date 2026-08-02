import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { orders } from './orders'

/** Siparis stok ve durum hareketlerini tutar. */
export const orderMovements = pgTable('order_movements', {
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId())
    .primaryKey(),
  orderId: varchar('order_id', { length: 128 })
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 30 }).notNull(),
  label: varchar('label', { length: 120 }).notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
