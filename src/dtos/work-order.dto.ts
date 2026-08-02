import { t } from 'elysia'
import {
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_STATUSES,
  WORK_ORDER_TYPES,
} from '../constants/work-order.constants'

const WorkOrderTypeSchema = t.Union([
  t.Literal(WORK_ORDER_TYPES.PERIODIC_MAINTENANCE),
  t.Literal(WORK_ORDER_TYPES.BREAKDOWN),
  t.Literal(WORK_ORDER_TYPES.INSPECTION),
  t.Literal(WORK_ORDER_TYPES.INSTALLATION),
])

const WorkOrderStatusSchema = t.Union([
  t.Literal(WORK_ORDER_STATUSES.PLANNED),
  t.Literal(WORK_ORDER_STATUSES.ASSIGNED),
  t.Literal(WORK_ORDER_STATUSES.IN_PROGRESS),
  t.Literal(WORK_ORDER_STATUSES.COMPLETED),
  t.Literal(WORK_ORDER_STATUSES.CANCELLED),
  t.Literal(WORK_ORDER_STATUSES.POSTPONED),
])

const WorkOrderPrioritySchema = t.Union([
  t.Literal(WORK_ORDER_PRIORITIES.LOW),
  t.Literal(WORK_ORDER_PRIORITIES.NORMAL),
  t.Literal(WORK_ORDER_PRIORITIES.URGENT),
])

// Is emri olusturma body semasi
export const CreateWorkOrderBody = t.Object({
  elevatorId: t.String({ minLength: 1 }),
  assignedTo: t.Optional(t.String({ minLength: 1 })),
  contractId: t.Optional(t.String({ minLength: 1 })),
  type: WorkOrderTypeSchema,
  priority: t.Optional(WorkOrderPrioritySchema),
  scheduledAt: t.Optional(t.Date()),
  description: t.Optional(t.String({ minLength: 1 })),
  internalNotes: t.Optional(t.String({ minLength: 1 })),
})

// Is emri guncelleme body semasi
export const UpdateWorkOrderBody = t.Partial(
  t.Object({
    assignedTo: t.Nullable(t.String({ minLength: 1 })),
    contractId: t.Nullable(t.String({ minLength: 1 })),
    type: WorkOrderTypeSchema,
    priority: WorkOrderPrioritySchema,
    scheduledAt: t.Nullable(t.Date()),
    description: t.Nullable(t.String({ minLength: 1 })),
    internalNotes: t.Nullable(t.String({ minLength: 1 })),
  }),
)

// Is emri durum gecisi body semasi
export const UpdateWorkOrderStatusBody = t.Object({
  status: WorkOrderStatusSchema,
})

// Is emri path param semasi
export const WorkOrderIdParam = t.Object({
  id: t.String({ minLength: 1 }),
})

// Is emri listeleme query semasi
export const WorkOrderListQuery = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
  search: t.Optional(t.String({ minLength: 1 })),
  status: t.Optional(WorkOrderStatusSchema),
  type: t.Optional(WorkOrderTypeSchema),
  priority: t.Optional(WorkOrderPrioritySchema),
  assignedTo: t.Optional(t.String({ minLength: 1 })),
  customerId: t.Optional(t.String({ minLength: 1 })),
  scheduledFrom: t.Optional(t.Date()),
  scheduledTo: t.Optional(t.Date()),
})

const WorkOrderElevatorContext = t.Object({
  id: t.String(),
  label: t.String(),
  siteId: t.String(),
  siteName: t.String(),
  customerId: t.String(),
  customerName: t.String(),
})

// Is emri yanit semasi
export const WorkOrderResponse = t.Object({
  id: t.String(),
  elevatorId: t.String(),
  assignedTo: t.Nullable(t.String()),
  contractId: t.Nullable(t.String()),
  type: t.String(),
  status: t.String(),
  priority: t.String(),
  scheduledAt: t.Nullable(t.Date()),
  startedAt: t.Nullable(t.Date()),
  completedAt: t.Nullable(t.Date()),
  description: t.Nullable(t.String()),
  internalNotes: t.Nullable(t.String()),
  createdBy: t.Nullable(t.String()),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  elevator: WorkOrderElevatorContext,
})

export const WorkOrderListResponse = t.Object({
  data: t.Array(WorkOrderResponse),
  pagination: t.Object({
    page: t.Integer(),
    limit: t.Integer(),
    total: t.Integer(),
    pages: t.Integer(),
  }),
})
