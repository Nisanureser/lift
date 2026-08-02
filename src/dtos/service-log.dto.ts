import { t } from 'elysia'
import { SERVICE_LOG_RESULTS } from '../constants/service-log.constants'
import { WorkOrderResponse } from './work-order.dto'

const ServiceLogResultSchema = t.Union([
  t.Literal(SERVICE_LOG_RESULTS.OK),
  t.Literal(SERVICE_LOG_RESULTS.NEEDS_FOLLOWUP),
  t.Literal(SERVICE_LOG_RESULTS.CRITICAL),
])

// Servis kaydi parca satiri semasi
export const ServicePartInput = t.Object({
  productId: t.String({ minLength: 1 }),
  quantity: t.String({ minLength: 1 }),
})

// Servis kaydi diger masraf satiri semasi
export const ServiceExpenseInput = t.Object({
  label: t.String({ minLength: 1 }),
  amount: t.String({ minLength: 1 }),
})

// Servis kaydi olusturma body semasi
export const CreateServiceLogBody = t.Object({
  elevatorId: t.String({ minLength: 1 }),
  workOrderId: t.Optional(t.String({ minLength: 1 })),
  arrivedAt: t.Optional(t.Date()),
  leftAt: t.Optional(t.Date()),
  summary: t.Optional(t.String({ minLength: 1 })),
  workPerformed: t.Optional(t.String({ minLength: 1 })),
  checklist: t.Optional(t.Any()),
  result: t.Optional(ServiceLogResultSchema),
  followUpNotes: t.Optional(t.String({ minLength: 1 })),
  laborCost: t.Optional(t.String({ minLength: 1 })),
  travelCost: t.Optional(t.String({ minLength: 1 })),
  parts: t.Optional(t.Array(ServicePartInput)),
  expenses: t.Optional(t.Array(ServiceExpenseInput)),
})

// Is emri tamamlama body semasi
export const CompleteWorkOrderBody = t.Object({
  arrivedAt: t.Optional(t.Date()),
  leftAt: t.Optional(t.Date()),
  summary: t.Optional(t.String({ minLength: 1 })),
  workPerformed: t.Optional(t.String({ minLength: 1 })),
  checklist: t.Optional(t.Any()),
  result: t.Optional(ServiceLogResultSchema),
  followUpNotes: t.Optional(t.String({ minLength: 1 })),
  laborCost: t.Optional(t.String({ minLength: 1 })),
  travelCost: t.Optional(t.String({ minLength: 1 })),
  parts: t.Optional(t.Array(ServicePartInput)),
  expenses: t.Optional(t.Array(ServiceExpenseInput)),
})

// Servis kaydi guncelleme body semasi
export const UpdateServiceLogBody = t.Partial(
  t.Object({
    arrivedAt: t.Nullable(t.Date()),
    leftAt: t.Nullable(t.Date()),
    summary: t.Nullable(t.String({ minLength: 1 })),
    workPerformed: t.Nullable(t.String({ minLength: 1 })),
    checklist: t.Nullable(t.Any()),
    result: ServiceLogResultSchema,
    followUpNotes: t.Nullable(t.String({ minLength: 1 })),
  }),
)

export const ServiceLogIdParam = t.Object({
  id: t.String({ minLength: 1 }),
})

export const ServiceLogPartParams = t.Object({
  id: t.String({ minLength: 1 }),
  partId: t.String({ minLength: 1 }),
})

export const AddServicePartBody = t.Object({
  productId: t.String({ minLength: 1 }),
  quantity: t.String({ minLength: 1 }),
})

export const ServiceLogListQuery = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
  result: t.Optional(ServiceLogResultSchema),
})

const ServiceLogPhotoResponse = t.Object({
  id: t.String(),
  url: t.String(),
  fileName: t.String(),
  mimeType: t.String(),
  sortOrder: t.Integer(),
  createdAt: t.Date(),
})

const ServicePartResponse = t.Object({
  id: t.String(),
  productId: t.String(),
  productName: t.String(),
  productSku: t.String(),
  quantity: t.String(),
  unitPrice: t.Nullable(t.String()),
  lineTotal: t.Nullable(t.String()),
  createdAt: t.Date(),
})

const ServiceExpenseResponse = t.Object({
  id: t.String(),
  label: t.String(),
  amount: t.String(),
  createdAt: t.Date(),
})

export const ServiceLogResponse = t.Object({
  id: t.String(),
  workOrderId: t.Nullable(t.String()),
  elevatorId: t.String(),
  arrivedAt: t.Nullable(t.Date()),
  leftAt: t.Nullable(t.Date()),
  summary: t.Nullable(t.String()),
  workPerformed: t.Nullable(t.String()),
  checklist: t.Nullable(t.Any()),
  result: t.String(),
  followUpNotes: t.Nullable(t.String()),
  laborCost: t.String(),
  travelCost: t.String(),
  materialsTotal: t.String(),
  expensesTotal: t.String(),
  totalCost: t.String(),
  createdBy: t.Nullable(t.String()),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  photos: t.Array(ServiceLogPhotoResponse),
  parts: t.Array(ServicePartResponse),
  expenses: t.Array(ServiceExpenseResponse),
})

export const ServiceLogListResponse = t.Object({
  data: t.Array(ServiceLogResponse),
  pagination: t.Object({
    page: t.Integer(),
    limit: t.Integer(),
    total: t.Integer(),
    pages: t.Integer(),
  }),
})

export const CompleteWorkOrderResponse = t.Object({
  workOrder: WorkOrderResponse,
  serviceLog: ServiceLogResponse,
})

export const ServicePartListResponse = t.Object({
  data: t.Array(ServicePartResponse),
})
