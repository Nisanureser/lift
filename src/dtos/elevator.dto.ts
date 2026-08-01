import { t } from 'elysia'
import { ELEVATOR_STATUSES } from '../constants/elevator.constants'

// Asansor durum semasi
const ElevatorStatusSchema = t.Union([
  t.Literal(ELEVATOR_STATUSES.ACTIVE),
  t.Literal(ELEVATOR_STATUSES.INACTIVE),
  t.Literal(ELEVATOR_STATUSES.FAULTY),
])

// Asansor olusturma body semasi
export const CreateElevatorBody = t.Object({
  label: t.String({ minLength: 2, maxLength: 200 }),
  brand: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  model: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  serialNumber: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  capacity: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
  installedAt: t.Optional(t.Date()),
  status: t.Optional(ElevatorStatusSchema),
  notes: t.Optional(t.String({ minLength: 1 })),
  isActive: t.Optional(t.Boolean()),
})

// Asansor guncelleme body semasi
export const UpdateElevatorBody = t.Partial(CreateElevatorBody)

// Musteri + tesis + asansor path param semasi
export const CustomerSiteElevatorParams = t.Object({
  id: t.String({ minLength: 1 }),
  siteId: t.String({ minLength: 1 }),
  elevatorId: t.String({ minLength: 1 }),
})

// Asansor listeleme query semasi
export const ElevatorListQuery = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
  search: t.Optional(t.String({ minLength: 1 })),
  status: t.Optional(ElevatorStatusSchema),
  isActive: t.Optional(t.Boolean()),
})

// Asansor yanit semasi
export const ElevatorResponse = t.Object({
  id: t.String(),
  siteId: t.String(),
  label: t.String(),
  brand: t.Nullable(t.String()),
  model: t.Nullable(t.String()),
  serialNumber: t.Nullable(t.String()),
  capacity: t.Nullable(t.String()),
  installedAt: t.Nullable(t.Date()),
  status: t.String(),
  notes: t.Nullable(t.String()),
  isActive: t.Boolean(),
  createdBy: t.Nullable(t.String()),
  createdAt: t.Date(),
  updatedAt: t.Date(),
})

// Sayfalanmis asansor listesi yanit semasi
export const ElevatorListResponse = t.Object({
  data: t.Array(ElevatorResponse),
  pagination: t.Object({
    page: t.Integer(),
    limit: t.Integer(),
    total: t.Integer(),
    pages: t.Integer(),
  }),
})
