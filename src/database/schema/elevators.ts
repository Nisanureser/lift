import { boolean, numeric, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { sites } from './sites'
import { users } from './users'

// Tesis bazinda asansor / cihaz kayitlarini tutar
export const elevators = pgTable('elevators', {
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId())
    .primaryKey(),
  siteId: varchar('site_id', { length: 128 })
    .notNull()
    .references(() => sites.id, { onDelete: 'restrict' }),
  label: varchar('label', { length: 200 }).notNull(),
  brand: varchar('brand', { length: 100 }),
  model: varchar('model', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  capacity: varchar('capacity', { length: 50 }),
  installedAt: timestamp('installed_at'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: varchar('created_by', { length: 128 }).references(() => users.id, {
    onDelete: 'set null',
  }),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
