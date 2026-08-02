import { and, count, desc, eq, gte, ilike, lte, or } from 'drizzle-orm'
import { ERROR_CODES } from '../constants/error-codes'
import {
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_STATUSES,
  WORK_ORDER_STATUS_TRANSITIONS,
  WORK_ORDER_TYPES,
  type WorkOrderPriority,
  type WorkOrderStatus,
  type WorkOrderType,
} from '../constants/work-order.constants'
import { db } from '../database'
import { customers, elevators, sites, users, workOrders } from '../database/schema'
import type {
  CreateWorkOrderInput,
  UpdateWorkOrderInput,
  WorkOrderDto,
  WorkOrderElevatorContext,
  WorkOrderListFilters,
} from '../types/work-order.types'
import {
  customerDisplayNameSql,
  ensureContractBelongsToCustomer,
  getCustomerIdForElevator,
} from './contract.service'
import { getElevatorOrThrow } from './elevator.service'
import { AppError } from '../utils/errors.util'
import { notDeleted, softDeleteFields } from '../utils/soft-delete.util'

// DB is emri kaydini API yanit formatina cevirir
function toWorkOrderDto(
  workOrder: typeof workOrders.$inferSelect,
  elevator: WorkOrderElevatorContext,
): WorkOrderDto {
  return {
    id: workOrder.id,
    elevatorId: workOrder.elevatorId,
    assignedTo: workOrder.assignedTo,
    contractId: workOrder.contractId,
    type: workOrder.type,
    status: workOrder.status,
    priority: workOrder.priority,
    scheduledAt: workOrder.scheduledAt,
    startedAt: workOrder.startedAt,
    completedAt: workOrder.completedAt,
    description: workOrder.description,
    internalNotes: workOrder.internalNotes,
    createdBy: workOrder.createdBy,
    createdAt: workOrder.createdAt,
    updatedAt: workOrder.updatedAt,
    elevator,
  }
}

// Opsiyonel string alani normalize eder
function normalizeOptionalString(value?: string): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

// Gecerli is emri tipi kontrolu yapar
function ensureValidWorkOrderType(type: string): asserts type is WorkOrderType {
  const valid = Object.values(WORK_ORDER_TYPES) as string[]

  if (!valid.includes(type)) {
    throw new AppError('Invalid work order type', 422, ERROR_CODES.INVALID_WORK_ORDER_TYPE)
  }
}

// Gecerli is emri onceligi kontrolu yapar
function ensureValidWorkOrderPriority(priority: string): asserts priority is WorkOrderPriority {
  const valid = Object.values(WORK_ORDER_PRIORITIES) as string[]

  if (!valid.includes(priority)) {
    throw new AppError('Invalid work order priority', 422, ERROR_CODES.INVALID_WORK_ORDER_PRIORITY)
  }
}

// Gecerli is emri durumu kontrolu yapar
function ensureValidWorkOrderStatus(status: string): asserts status is WorkOrderStatus {
  const valid = Object.values(WORK_ORDER_STATUSES) as string[]

  if (!valid.includes(status)) {
    throw new AppError('Invalid work order status', 422, ERROR_CODES.INVALID_WORK_ORDER_STATUS)
  }
}

// Durum gecisinin izinli olup olmadigini kontrol eder
function ensureStatusTransition(current: WorkOrderStatus, next: WorkOrderStatus): void {
  const allowed = WORK_ORDER_STATUS_TRANSITIONS[current]

  if (!allowed.includes(next)) {
    throw new AppError('Invalid work order status transition', 422, ERROR_CODES.INVALID_WORK_ORDER_STATUS)
  }
}

// Teknisyen kullanicisinin varligini dogrular
async function ensureAssignedUserExists(userId: string): Promise<void> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.isActive, true)))
    .limit(1)

  if (!user) {
    throw new AppError('Assigned user not found', 404, ERROR_CODES.ASSIGNED_USER_NOT_FOUND)
  }
}

// Asansor baglam bilgisini getirir
export async function getElevatorContext(elevatorId: string): Promise<WorkOrderElevatorContext> {
  await getElevatorOrThrow(elevatorId)

  const [row] = await db
    .select({
      id: elevators.id,
      label: elevators.label,
      siteId: sites.id,
      siteName: sites.name,
      customerId: customers.id,
      customerName: customerDisplayNameSql(),
    })
    .from(elevators)
    .innerJoin(sites, eq(elevators.siteId, sites.id))
    .innerJoin(customers, eq(sites.customerId, customers.id))
    .where(
      and(
        eq(elevators.id, elevatorId),
        notDeleted(elevators.deletedAt),
        notDeleted(sites.deletedAt),
        notDeleted(customers.deletedAt),
      ),
    )
    .limit(1)

  if (!row) {
    throw new AppError('Elevator not found', 404, ERROR_CODES.ELEVATOR_NOT_FOUND)
  }

  return row
}

// Is emrini bulur; yoksa 404 firlatir
export async function getWorkOrderOrThrow(workOrderId: string): Promise<typeof workOrders.$inferSelect> {
  const [workOrder] = await db
    .select()
    .from(workOrders)
    .where(and(eq(workOrders.id, workOrderId), notDeleted(workOrders.deletedAt)))
    .limit(1)

  if (!workOrder) {
    throw new AppError('Work order not found', 404, ERROR_CODES.WORK_ORDER_NOT_FOUND)
  }

  return workOrder
}

// Is emri detayini baglam bilgisiyle dondurur
export async function getWorkOrderDtoById(workOrderId: string): Promise<WorkOrderDto> {
  const workOrder = await getWorkOrderOrThrow(workOrderId)
  const elevator = await getElevatorContext(workOrder.elevatorId)
  return toWorkOrderDto(workOrder, elevator)
}

// Yeni is emri olusturur
export async function createWorkOrder(
  input: CreateWorkOrderInput,
  userId: string,
): Promise<WorkOrderDto> {
  ensureValidWorkOrderType(input.type)

  const priority = input.priority ?? WORK_ORDER_PRIORITIES.NORMAL
  ensureValidWorkOrderPriority(priority)

  await getElevatorOrThrow(input.elevatorId)

  if (input.assignedTo) {
    await ensureAssignedUserExists(input.assignedTo)
  }

  if (input.contractId) {
    const customerId = await getCustomerIdForElevator(input.elevatorId)
    await ensureContractBelongsToCustomer(input.contractId, customerId)
  }

  const status = input.assignedTo ? WORK_ORDER_STATUSES.ASSIGNED : WORK_ORDER_STATUSES.PLANNED

  const [workOrder] = await db
    .insert(workOrders)
    .values({
      elevatorId: input.elevatorId,
      assignedTo: input.assignedTo ?? null,
      contractId: input.contractId ?? null,
      type: input.type,
      status,
      priority,
      scheduledAt: input.scheduledAt ?? null,
      description: normalizeOptionalString(input.description) ?? null,
      internalNotes: normalizeOptionalString(input.internalNotes) ?? null,
      createdBy: userId,
    })
    .returning()

  if (!workOrder) {
    throw new AppError('Failed to create work order', 500, ERROR_CODES.WORK_ORDER_CREATE_FAILED)
  }

  const elevator = await getElevatorContext(workOrder.elevatorId)
  return toWorkOrderDto(workOrder, elevator)
}

// Is emirlerini filtreli listeler
export async function listWorkOrders(filters: WorkOrderListFilters): Promise<{
  data: WorkOrderDto[]
  pagination: { page: number; limit: number; total: number; pages: number }
}> {
  const page = Number(filters.page ?? 1)
  const limit = Number(filters.limit ?? 20)
  const offset = (page - 1) * limit

  const conditions = [notDeleted(workOrders.deletedAt)]

  if (filters.status) {
    conditions.push(eq(workOrders.status, filters.status))
  }

  if (filters.type) {
    conditions.push(eq(workOrders.type, filters.type))
  }

  if (filters.priority) {
    conditions.push(eq(workOrders.priority, filters.priority))
  }

  if (filters.assignedTo) {
    conditions.push(eq(workOrders.assignedTo, filters.assignedTo))
  }

  if (filters.scheduledFrom) {
    conditions.push(gte(workOrders.scheduledAt, filters.scheduledFrom))
  }

  if (filters.scheduledTo) {
    conditions.push(lte(workOrders.scheduledAt, filters.scheduledTo))
  }

  if (filters.customerId) {
    conditions.push(eq(customers.id, filters.customerId))
  }

  if (filters.search) {
    const term = `%${filters.search}%`
    conditions.push(
      or(
        ilike(workOrders.description, term),
        ilike(workOrders.internalNotes, term),
        ilike(elevators.label, term),
        ilike(sites.name, term),
        ilike(customers.companyName, term),
        ilike(customers.firstName, term),
        ilike(customers.lastName, term),
      )!,
    )
  }

  const whereClause = and(...conditions)

  const baseQuery = db
    .select({
      workOrder: workOrders,
      elevatorId: elevators.id,
      elevatorLabel: elevators.label,
      siteId: sites.id,
      siteName: sites.name,
      customerId: customers.id,
      customerName: customerDisplayNameSql(),
    })
    .from(workOrders)
    .innerJoin(elevators, eq(workOrders.elevatorId, elevators.id))
    .innerJoin(sites, eq(elevators.siteId, sites.id))
    .innerJoin(customers, eq(sites.customerId, customers.id))
    .where(
      and(
        whereClause,
        notDeleted(elevators.deletedAt),
        notDeleted(sites.deletedAt),
        notDeleted(customers.deletedAt),
      ),
    )

  const [rows, countResult] = await Promise.all([
    baseQuery.orderBy(desc(workOrders.createdAt)).limit(limit).offset(offset),
    db
      .select({ total: count() })
      .from(workOrders)
      .innerJoin(elevators, eq(workOrders.elevatorId, elevators.id))
      .innerJoin(sites, eq(elevators.siteId, sites.id))
      .innerJoin(customers, eq(sites.customerId, customers.id))
      .where(
        and(
          whereClause,
          notDeleted(elevators.deletedAt),
          notDeleted(sites.deletedAt),
          notDeleted(customers.deletedAt),
        ),
      ),
  ])

  const totalCount = Number(countResult[0]?.total ?? 0)

  return {
    data: rows.map((row) =>
      toWorkOrderDto(row.workOrder, {
        id: row.elevatorId,
        label: row.elevatorLabel,
        siteId: row.siteId,
        siteName: row.siteName,
        customerId: row.customerId,
        customerName: row.customerName,
      }),
    ),
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit) || 1,
    },
  }
}

// Is emrini gunceller
export async function updateWorkOrder(
  workOrderId: string,
  input: UpdateWorkOrderInput,
): Promise<WorkOrderDto> {
  const existing = await getWorkOrderOrThrow(workOrderId)

  if (existing.status === WORK_ORDER_STATUSES.COMPLETED) {
    throw new AppError('Work order already completed', 422, ERROR_CODES.WORK_ORDER_ALREADY_COMPLETED)
  }

  if (input.type) {
    ensureValidWorkOrderType(input.type)
  }

  if (input.priority) {
    ensureValidWorkOrderPriority(input.priority)
  }

  if (input.assignedTo) {
    await ensureAssignedUserExists(input.assignedTo)
  }

  if (input.contractId) {
    const customerId = await getCustomerIdForElevator(existing.elevatorId)
    await ensureContractBelongsToCustomer(input.contractId, customerId)
  }

  let nextStatus = existing.status

  if (input.assignedTo !== undefined) {
    if (input.assignedTo && existing.status === WORK_ORDER_STATUSES.PLANNED) {
      nextStatus = WORK_ORDER_STATUSES.ASSIGNED
    }

    if (!input.assignedTo && existing.status === WORK_ORDER_STATUSES.ASSIGNED) {
      nextStatus = WORK_ORDER_STATUSES.PLANNED
    }
  }

  const [updated] = await db
    .update(workOrders)
    .set({
      ...(input.assignedTo !== undefined ? { assignedTo: input.assignedTo } : {}),
      ...(input.contractId !== undefined ? { contractId: input.contractId } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.scheduledAt !== undefined ? { scheduledAt: input.scheduledAt } : {}),
      ...(input.description !== undefined
        ? { description: normalizeOptionalString(input.description) ?? null }
        : {}),
      ...(input.internalNotes !== undefined
        ? { internalNotes: normalizeOptionalString(input.internalNotes) ?? null }
        : {}),
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(and(eq(workOrders.id, workOrderId), notDeleted(workOrders.deletedAt)))
    .returning()

  if (!updated) {
    throw new AppError('Work order not found', 404, ERROR_CODES.WORK_ORDER_NOT_FOUND)
  }

  const elevator = await getElevatorContext(updated.elevatorId)
  return toWorkOrderDto(updated, elevator)
}

// Is emri durumunu gunceller
export async function updateWorkOrderStatus(
  workOrderId: string,
  nextStatus: WorkOrderStatus,
): Promise<WorkOrderDto> {
  ensureValidWorkOrderStatus(nextStatus)

  const existing = await getWorkOrderOrThrow(workOrderId)
  ensureStatusTransition(existing.status as WorkOrderStatus, nextStatus)

  const now = new Date()
  const patch: Partial<typeof workOrders.$inferInsert> = {
    status: nextStatus,
    updatedAt: now,
  }

  if (nextStatus === WORK_ORDER_STATUSES.IN_PROGRESS && !existing.startedAt) {
    patch.startedAt = now
  }

  if (nextStatus === WORK_ORDER_STATUSES.COMPLETED) {
    patch.completedAt = now
  }

  const [updated] = await db
    .update(workOrders)
    .set(patch)
    .where(and(eq(workOrders.id, workOrderId), notDeleted(workOrders.deletedAt)))
    .returning()

  if (!updated) {
    throw new AppError('Work order not found', 404, ERROR_CODES.WORK_ORDER_NOT_FOUND)
  }

  const elevator = await getElevatorContext(updated.elevatorId)
  return toWorkOrderDto(updated, elevator)
}

// Is emrini soft delete ile siler
export async function deleteWorkOrder(workOrderId: string): Promise<void> {
  await getWorkOrderOrThrow(workOrderId)

  await db
    .update(workOrders)
    .set(softDeleteFields())
    .where(and(eq(workOrders.id, workOrderId), notDeleted(workOrders.deletedAt)))
}

// Is emrini tamamlandi olarak isaretler (servis kaydi olusturma icin internal)
export async function markWorkOrderCompleted(
  workOrderId: string,
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
): Promise<typeof workOrders.$inferSelect> {
  const [existing] = await tx
    .select()
    .from(workOrders)
    .where(and(eq(workOrders.id, workOrderId), notDeleted(workOrders.deletedAt)))
    .limit(1)

  if (!existing) {
    throw new AppError('Work order not found', 404, ERROR_CODES.WORK_ORDER_NOT_FOUND)
  }

  if (existing.status === WORK_ORDER_STATUSES.COMPLETED) {
    throw new AppError('Work order already completed', 422, ERROR_CODES.WORK_ORDER_ALREADY_COMPLETED)
  }

  const allowedFrom: WorkOrderStatus[] = [
    WORK_ORDER_STATUSES.ASSIGNED,
    WORK_ORDER_STATUSES.IN_PROGRESS,
    WORK_ORDER_STATUSES.POSTPONED,
  ]

  if (!allowedFrom.includes(existing.status as WorkOrderStatus)) {
    throw new AppError('Invalid work order status transition', 422, ERROR_CODES.INVALID_WORK_ORDER_STATUS)
  }

  const now = new Date()

  const [updated] = await tx
    .update(workOrders)
    .set({
      status: WORK_ORDER_STATUSES.COMPLETED,
      completedAt: now,
      startedAt: existing.startedAt ?? now,
      updatedAt: now,
    })
    .where(eq(workOrders.id, workOrderId))
    .returning()

  if (!updated) {
    throw new AppError('Work order not found', 404, ERROR_CODES.WORK_ORDER_NOT_FOUND)
  }

  return updated
}
