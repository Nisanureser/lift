import { numeric, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { orders } from './orders'
import { products } from './products'

/** Siparis kalem satirlarini tutar. */
export const orderItems = pgTable('order_items', {
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId())
    .primaryKey(),
  orderId: varchar('order_id', { length: 128 })
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 128 })
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }),
  productName: varchar('product_name', { length: 200 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull(),
  lineTotal: numeric('line_total', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
