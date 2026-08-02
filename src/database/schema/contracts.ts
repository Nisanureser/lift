import { boolean, date, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { customers } from './customers'
import { elevators } from './elevators'
import { sites } from './sites'
import { users } from './users'

// Musteri bakim / hizmet sozlesmelerini tutar
export const contracts = pgTable('contracts', {
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId())
    .primaryKey(),
  customerId: varchar('customer_id', { length: 128 })
    .notNull()
    .references(() => customers.id, { onDelete: 'restrict' }),
  siteId: varchar('site_id', { length: 128 }).references(() => sites.id, { onDelete: 'set null' }),
  elevatorId: varchar('elevator_id', { length: 128 }).references(() => elevators.id, {
    onDelete: 'set null',
  }),
  type: varchar('type', { length: 30 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  visitFrequency: varchar('visit_frequency', { length: 20 }).notNull(),
  notes: text('notes'),
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: varchar('created_by', { length: 128 }).references(() => users.id, {
    onDelete: 'set null',
  }),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
