import { numeric, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { products } from './products'
import { serviceLogs } from './service-logs'

// Servis kaydinda kullanilan parca ve miktar bilgisini tutar
export const serviceParts = pgTable('service_parts', {
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId())
    .primaryKey(),
  serviceLogId: varchar('service_log_id', { length: 128 })
    .notNull()
    .references(() => serviceLogs.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 128 })
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }),
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }),
  lineTotal: numeric('line_total', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
