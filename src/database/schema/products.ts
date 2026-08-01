import { boolean, numeric, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { categories } from './categories'
import { users } from './users'

// Urun kaydini tutar (ad, sku, fiyat, birim, stok, kategori)
export const products = pgTable('products', {
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId())
    .primaryKey(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description').notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 50 }).notNull(),
  stockQuantity: numeric('stock_quantity', { precision: 12, scale: 3 }).default('0').notNull(),
  categoryId: varchar('category_id', { length: 128 })
    .notNull()
    .references(() => categories.id, { onDelete: 'restrict' }),
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: varchar('created_by', { length: 128 }).references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
})
