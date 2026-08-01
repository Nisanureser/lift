import { boolean, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { users } from './users'

// Bireysel ve kurumsal musteri kayitlarini tek tabloda tutar
export const customers = pgTable('customers', {
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId())
    .primaryKey(),
  type: varchar('type', { length: 20 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  nationalId: varchar('national_id', { length: 11 }).unique(),
  companyName: varchar('company_name', { length: 200 }),
  taxNumber: varchar('tax_number', { length: 20 }).unique(),
  taxOffice: varchar('tax_office', { length: 150 }),
  contactPersonName: varchar('contact_person_name', { length: 150 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: varchar('created_by', { length: 128 }).references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
})
