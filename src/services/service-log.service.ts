import { and, count, desc, eq } from 'drizzle-orm'
import { ERROR_CODES } from '../constants/error-codes'
import { MAX_PHOTOS_PER_SERVICE_LOG, SERVICE_LOG_RESULTS, type ServiceLogResult } from '../constants/service-log.constants'
import { WORK_ORDER_STATUSES } from '../constants/work-order.constants'
import { db } from '../database'
import {
  products,
  serviceLogPhotos,
  serviceLogs,
  serviceParts,
} from '../database/schema'
import type {
  AddServicePartInput,
  CompleteWorkOrderInput,
  CreateServiceLogInput,
  ServiceLogDto,
  ServiceLogListFilters,
  ServicePartDto,
  ServicePartInputItem,
  UpdateServiceLogInput,
  WorkOrderDto,
} from '../types/work-order.types'
import { getElevatorOrThrow } from './elevator.service'
import { getProductOrThrow } from './product.service'
import { uploadObject } from './storage.service'
import { parseStockQuantity, stockOutBatchInTransaction } from './stock.service'
import {
  getWorkOrderDtoById,
  getWorkOrderOrThrow,
  markWorkOrderCompleted,
} from './work-order.service'
import { AppError } from '../utils/errors.util'
import {
  buildImageFileName,
  buildServiceLogObjectKey,
  toPublicFileUrl,
  validateImageFile,
} from '../utils/file.util'
import { notDeleted, softDeleteFields } from '../utils/soft-delete.util'

// Gecerli servis sonucu kontrolu yapar
function ensureValidServiceLogResult(result: string): asserts result is ServiceLogResult {
  const valid = Object.values(SERVICE_LOG_RESULTS) as string[]

  if (!valid.includes(result)) {
    throw new AppError('Invalid service log result', 422, ERROR_CODES.INVALID_SERVICE_LOG_RESULT)
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

// Servis kaydina ait fotograflari getirir
async function getServiceLogPhotos(serviceLogId: string) {
  return db
    .select()
    .from(serviceLogPhotos)
    .where(and(eq(serviceLogPhotos.serviceLogId, serviceLogId), notDeleted(serviceLogPhotos.deletedAt)))
    .orderBy(serviceLogPhotos.sortOrder)
}

// Servis kaydina ait parcalari getirir
async function getServiceLogParts(serviceLogId: string): Promise<ServicePartDto[]> {
  const rows = await db
    .select({
      id: serviceParts.id,
      productId: serviceParts.productId,
      productName: products.name,
      productSku: products.sku,
      quantity: serviceParts.quantity,
      createdAt: serviceParts.createdAt,
    })
    .from(serviceParts)
    .innerJoin(products, eq(serviceParts.productId, products.id))
    .where(eq(serviceParts.serviceLogId, serviceLogId))
    .orderBy(desc(serviceParts.createdAt))

  return rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    productName: row.productName,
    productSku: row.productSku,
    quantity: String(row.quantity),
    createdAt: row.createdAt,
  }))
}

// Servis kaydi DTO'sunu olusturur
async function toServiceLogDto(log: typeof serviceLogs.$inferSelect): Promise<ServiceLogDto> {
  const photos = await getServiceLogPhotos(log.id)
  const parts = await getServiceLogParts(log.id)

  return {
    id: log.id,
    workOrderId: log.workOrderId,
    elevatorId: log.elevatorId,
    arrivedAt: log.arrivedAt,
    leftAt: log.leftAt,
    summary: log.summary,
    workPerformed: log.workPerformed,
    checklist: log.checklist,
    result: log.result,
    followUpNotes: log.followUpNotes,
    createdBy: log.createdBy,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt,
    photos: photos.map((photo) => ({
      id: photo.id,
      url: toPublicFileUrl(photo.filePath),
      fileName: photo.fileName,
      mimeType: photo.mimeType,
      sortOrder: photo.sortOrder,
      createdAt: photo.createdAt,
    })),
    parts,
  }
}

// Servis kaydini bulur; yoksa 404 firlatir
export async function getServiceLogOrThrow(serviceLogId: string): Promise<typeof serviceLogs.$inferSelect> {
  const [log] = await db
    .select()
    .from(serviceLogs)
    .where(and(eq(serviceLogs.id, serviceLogId), notDeleted(serviceLogs.deletedAt)))
    .limit(1)

  if (!log) {
    throw new AppError('Service log not found', 404, ERROR_CODES.SERVICE_LOG_NOT_FOUND)
  }

  return log
}

// Servis kaydina parca ekler ve stoktan dusurur
async function addPartsToServiceLog(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  serviceLogId: string,
  parts: ServicePartInputItem[],
  userId: string,
): Promise<void> {
  if (parts.length === 0) {
    return
  }

  const batchItems = []

  for (const part of parts) {
    await getProductOrThrow(part.productId)
    const quantity = parseStockQuantity(part.quantity)

    await tx.insert(serviceParts).values({
      serviceLogId,
      productId: part.productId,
      quantity: quantity.toFixed(3),
    })

    batchItems.push({ productId: part.productId, quantity })
  }

  await stockOutBatchInTransaction(tx, batchItems, userId, `Servis kaydi: ${serviceLogId}`)
}

// Servis kaydi olusturur (transaction icinde veya disinda)
async function insertServiceLog(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: {
    elevatorId: string
    workOrderId?: string | null
    arrivedAt?: Date | null
    leftAt?: Date | null
    summary?: string | null
    workPerformed?: string | null
    checklist?: unknown | null
    result?: string
    followUpNotes?: string | null
  },
  userId: string,
  parts: ServicePartInputItem[] = [],
): Promise<typeof serviceLogs.$inferSelect> {
  const result = input.result ?? SERVICE_LOG_RESULTS.OK
  ensureValidServiceLogResult(result)

  const [log] = await tx
    .insert(serviceLogs)
    .values({
      workOrderId: input.workOrderId ?? null,
      elevatorId: input.elevatorId,
      arrivedAt: input.arrivedAt ?? null,
      leftAt: input.leftAt ?? null,
      summary: input.summary ?? null,
      workPerformed: input.workPerformed ?? null,
      checklist: input.checklist ?? null,
      result,
      followUpNotes: input.followUpNotes ?? null,
      createdBy: userId,
    })
    .returning()

  if (!log) {
    throw new AppError('Failed to create service log', 500, ERROR_CODES.SERVICE_LOG_CREATE_FAILED)
  }

  await addPartsToServiceLog(tx, log.id, parts, userId)

  return log
}

// Ad-hoc servis kaydi olusturur
export async function createServiceLog(
  input: CreateServiceLogInput,
  userId: string,
): Promise<ServiceLogDto> {
  await getElevatorOrThrow(input.elevatorId)

  if (input.workOrderId) {
    const workOrder = await getWorkOrderOrThrow(input.workOrderId)

    if (workOrder.elevatorId !== input.elevatorId) {
      throw new AppError('Work order elevator mismatch', 422, ERROR_CODES.VALIDATION_ERROR)
    }
  }

  const log = await db.transaction(async (tx) =>
    insertServiceLog(
      tx,
      {
        elevatorId: input.elevatorId,
        workOrderId: input.workOrderId ?? null,
        arrivedAt: input.arrivedAt ?? null,
        leftAt: input.leftAt ?? null,
        summary: normalizeOptionalString(input.summary) ?? null,
        workPerformed: normalizeOptionalString(input.workPerformed) ?? null,
        checklist: input.checklist ?? null,
        result: input.result,
        followUpNotes: normalizeOptionalString(input.followUpNotes) ?? null,
      },
      userId,
      input.parts ?? [],
    ),
  )

  return toServiceLogDto(log)
}

// Is emrini tamamlar ve servis kaydi olusturur
export async function completeWorkOrder(
  workOrderId: string,
  input: CompleteWorkOrderInput,
  userId: string,
): Promise<{ workOrder: WorkOrderDto; serviceLog: ServiceLogDto }> {
  const existing = await getWorkOrderOrThrow(workOrderId)

  if (existing.status === WORK_ORDER_STATUSES.COMPLETED) {
    throw new AppError('Work order already completed', 422, ERROR_CODES.WORK_ORDER_ALREADY_COMPLETED)
  }

  const result = await db.transaction(async (tx) => {
    const completedWorkOrder = await markWorkOrderCompleted(workOrderId, tx)

    const log = await insertServiceLog(
      tx,
      {
        elevatorId: completedWorkOrder.elevatorId,
        workOrderId: completedWorkOrder.id,
        arrivedAt: input.arrivedAt ?? null,
        leftAt: input.leftAt ?? null,
        summary: normalizeOptionalString(input.summary) ?? null,
        workPerformed: normalizeOptionalString(input.workPerformed) ?? null,
        checklist: input.checklist ?? null,
        result: input.result,
        followUpNotes: normalizeOptionalString(input.followUpNotes) ?? null,
      },
      userId,
      input.parts ?? [],
    )

    return { completedWorkOrder, log }
  })

  const workOrder = await getWorkOrderDtoById(result.completedWorkOrder.id)
  const serviceLog = await toServiceLogDto(result.log)

  return { workOrder, serviceLog }
}

// Servis kaydi detayini getirir
export async function getServiceLogById(serviceLogId: string): Promise<ServiceLogDto> {
  const log = await getServiceLogOrThrow(serviceLogId)
  return toServiceLogDto(log)
}

// Asansor servis gecmisini listeler
export async function listServiceLogsByElevator(
  elevatorId: string,
  filters: ServiceLogListFilters,
): Promise<{
  data: ServiceLogDto[]
  pagination: { page: number; limit: number; total: number; pages: number }
}> {
  await getElevatorOrThrow(elevatorId)

  const page = Number(filters.page ?? 1)
  const limit = Number(filters.limit ?? 20)
  const offset = (page - 1) * limit

  const conditions = [eq(serviceLogs.elevatorId, elevatorId), notDeleted(serviceLogs.deletedAt)]

  if (filters.result) {
    conditions.push(eq(serviceLogs.result, filters.result))
  }

  const whereClause = and(...conditions)

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(serviceLogs)
      .where(whereClause)
      .orderBy(desc(serviceLogs.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(serviceLogs).where(whereClause),
  ])

  const totalCount = Number(countResult[0]?.total ?? 0)
  const data = await Promise.all(rows.map((row) => toServiceLogDto(row)))

  return {
    data,
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit) || 1,
    },
  }
}

// Servis kaydini gunceller
export async function updateServiceLog(
  serviceLogId: string,
  input: UpdateServiceLogInput,
): Promise<ServiceLogDto> {
  await getServiceLogOrThrow(serviceLogId)

  if (input.result) {
    ensureValidServiceLogResult(input.result)
  }

  const [updated] = await db
    .update(serviceLogs)
    .set({
      ...(input.arrivedAt !== undefined ? { arrivedAt: input.arrivedAt } : {}),
      ...(input.leftAt !== undefined ? { leftAt: input.leftAt } : {}),
      ...(input.summary !== undefined ? { summary: normalizeOptionalString(input.summary) ?? null } : {}),
      ...(input.workPerformed !== undefined
        ? { workPerformed: normalizeOptionalString(input.workPerformed) ?? null }
        : {}),
      ...(input.checklist !== undefined ? { checklist: input.checklist } : {}),
      ...(input.result !== undefined ? { result: input.result } : {}),
      ...(input.followUpNotes !== undefined
        ? { followUpNotes: normalizeOptionalString(input.followUpNotes) ?? null }
        : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(serviceLogs.id, serviceLogId), notDeleted(serviceLogs.deletedAt)))
    .returning()

  if (!updated) {
    throw new AppError('Service log not found', 404, ERROR_CODES.SERVICE_LOG_NOT_FOUND)
  }

  return toServiceLogDto(updated)
}

// Servis kaydini soft delete ile siler
export async function deleteServiceLog(serviceLogId: string): Promise<void> {
  await getServiceLogOrThrow(serviceLogId)

  await db
    .update(serviceLogs)
    .set(softDeleteFields())
    .where(and(eq(serviceLogs.id, serviceLogId), notDeleted(serviceLogs.deletedAt)))
}

// Servis kaydina fotograf yukler
export async function uploadServiceLogPhoto(
  serviceLogId: string,
  file: File,
  userId: string,
): Promise<ServiceLogDto> {
  await getServiceLogOrThrow(serviceLogId)
  validateImageFile(file)

  const existingPhotos = await getServiceLogPhotos(serviceLogId)

  if (existingPhotos.length >= MAX_PHOTOS_PER_SERVICE_LOG) {
    throw new AppError('Too many photos for service log', 422, ERROR_CODES.TOO_MANY_SERVICE_LOG_PHOTOS)
  }

  const fileName = buildImageFileName(file.name)
  const objectKey = buildServiceLogObjectKey(serviceLogId, fileName)
  const buffer = Buffer.from(await file.arrayBuffer())

  await uploadObject(objectKey, buffer, file.type)

  await db.insert(serviceLogPhotos).values({
    serviceLogId,
    fileName,
    filePath: objectKey,
    mimeType: file.type,
    sortOrder: existingPhotos.length,
  })

  return getServiceLogById(serviceLogId)
}

// Servis kaydina parca ekler
export async function addServicePart(
  serviceLogId: string,
  input: AddServicePartInput,
  userId: string,
): Promise<ServiceLogDto> {
  await getServiceLogOrThrow(serviceLogId)

  await db.transaction(async (tx) => {
    await addPartsToServiceLog(tx, serviceLogId, [input], userId)
  })

  return getServiceLogById(serviceLogId)
}

// Servis kaydinin parcalarini listeler
export async function listServiceParts(serviceLogId: string): Promise<ServicePartDto[]> {
  await getServiceLogOrThrow(serviceLogId)
  return getServiceLogParts(serviceLogId)
}
