import { numeric, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { users } from './users'

/** Fabrika malzeme siparis kaydini tutar. */
export const orders = pgTable('orders', {
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId())
    .primaryKey(),
  paymentMethodId: varchar('payment_method_id', { length: 30 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('tamamlandi'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  customerNote: text('customer_note'),
  createdBy: varchar('created_by', { length: 128 }).references(() => users.id, {
    onDelete: 'set null',
  }),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
