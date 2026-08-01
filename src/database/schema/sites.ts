import { boolean, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { customers } from './customers'
import { users } from './users'

// Musteriye bagli tesis / bina kayitlarini tutar
export const sites = pgTable('sites', {
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId())
    .primaryKey(),
  customerId: varchar('customer_id', { length: 128 })
    .notNull()
    .references(() => customers.id, { onDelete: 'restrict' }),
  name: varchar('name', { length: 200 }).notNull(),
  address: text('address').notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  district: varchar('district', { length: 100 }).notNull(),
  contactName: varchar('contact_name', { length: 150 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  notes: text('notes'),
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: varchar('created_by', { length: 128 }).references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
})
