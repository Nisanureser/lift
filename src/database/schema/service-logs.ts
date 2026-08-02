import { jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { elevators } from './elevators'
import { users } from './users'
import { workOrders } from './work-orders'

// Teknisyen saha ziyaret kayitlarini tutar
export const serviceLogs = pgTable('service_logs', {
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId())
    .primaryKey(),
  workOrderId: varchar('work_order_id', { length: 128 }).references(() => workOrders.id, {
    onDelete: 'set null',
  }),
  elevatorId: varchar('elevator_id', { length: 128 })
    .notNull()
    .references(() => elevators.id, { onDelete: 'restrict' }),
  arrivedAt: timestamp('arrived_at'),
  leftAt: timestamp('left_at'),
  summary: text('summary'),
  workPerformed: text('work_performed'),
  checklist: jsonb('checklist'),
  result: varchar('result', { length: 20 }).notNull().default('ok'),
  followUpNotes: text('follow_up_notes'),
  createdBy: varchar('created_by', { length: 128 }).references(() => users.id, {
    onDelete: 'set null',
  }),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
