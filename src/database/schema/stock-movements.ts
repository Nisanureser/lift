import { numeric, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { products } from './products'
import { users } from './users'

// Urun stok hareket gecmisini tutar (giris, cikis, duzeltme)
export const stockMovements = pgTable('stock_movements', {
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId())
    .primaryKey(),
  productId: varchar('product_id', { length: 128 })
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull(),
  previousStock: numeric('previous_stock', { precision: 12, scale: 3 }).notNull(),
  newStock: numeric('new_stock', { precision: 12, scale: 3 }).notNull(),
  note: text('note'),
  createdBy: varchar('created_by', { length: 128 }).references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
