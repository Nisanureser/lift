import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { contracts } from './contracts'
import { elevators } from './elevators'
import { users } from './users'

// Planlanan veya acil saha is emirlerini tutar
export const workOrders = pgTable('work_orders', {
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId())
    .primaryKey(),
  elevatorId: varchar('elevator_id', { length: 128 })
    .notNull()
    .references(() => elevators.id, { onDelete: 'restrict' }),
  assignedTo: varchar('assigned_to', { length: 128 }).references(() => users.id, {
    onDelete: 'set null',
  }),
  contractId: varchar('contract_id', { length: 128 }).references(() => contracts.id, {
    onDelete: 'set null',
  }),
  type: varchar('type', { length: 30 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('planned'),
  priority: varchar('priority', { length: 10 }).notNull().default('normal'),
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  description: text('description'),
  internalNotes: text('internal_notes'),
  createdBy: varchar('created_by', { length: 128 }).references(() => users.id, {
    onDelete: 'set null',
  }),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
