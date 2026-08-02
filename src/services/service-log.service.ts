import { and, count, desc, eq } from 'drizzle-orm'
import { ERROR_CODES } from '../constants/error-codes'
import { MAX_PHOTOS_PER_SERVICE_LOG, SERVICE_LOG_RESULTS, type ServiceLogResult } from '../constants/service-log.constants'
import { WORK_ORDER_STATUSES } from '../constants/work-order.constants'
import { db } from '../database'
import {
  products,
  serviceExpenses,
  serviceLogPhotos,
  serviceLogs,
  serviceParts,
} from '../database/schema'
import type {
  AddServicePartInput,
  CompleteWorkOrderInput,
  CreateServiceLogInput,
  ServiceExpenseDto,
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

// Opsiyonel string alani normalize eder (undefined: degistirme, null: temizle)
function normalizeOptionalString(value?: string | null): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

// Para tutarini parse eder (max 2 ondalik)
function parseMoneyAmount(value?: string): number {
  if (value === undefined || value.trim().length === 0) {
    return 0
  }

  const normalized = value.trim().replace(',', '.')
  const amount = Number(normalized)

  if (!Number.isFinite(amount) || amount < 0) {
    throw new AppError('Invalid money amount', 422, ERROR_CODES.VALIDATION_ERROR)
  }

  return Math.round(amount * 100) / 100
}

// Para tutarini API string formatina cevirir
function formatMoneyAmount(value: number): string {
  return value.toFixed(2)
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
      unitPrice: serviceParts.unitPrice,
      lineTotal: serviceParts.lineTotal,
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
    unitPrice: row.unitPrice ? String(row.unitPrice) : null,
    lineTotal: row.lineTotal ? String(row.lineTotal) : null,
    createdAt: row.createdAt,
  }))
}

// Servis kaydina ait diger masraflari getirir
async function getServiceLogExpenses(serviceLogId: string): Promise<ServiceExpenseDto[]> {
  const rows = await db
    .select()
    .from(serviceExpenses)
    .where(eq(serviceExpenses.serviceLogId, serviceLogId))
    .orderBy(desc(serviceExpenses.createdAt))

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    amount: String(row.amount),
    createdAt: row.createdAt,
  }))
}

// Servis kaydi DTO'sunu olusturur
async function toServiceLogDto(log: typeof serviceLogs.$inferSelect): Promise<ServiceLogDto> {
  const photos = await getServiceLogPhotos(log.id)
  const parts = await getServiceLogParts(log.id)
  const expenses = await getServiceLogExpenses(log.id)

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
    laborCost: String(log.laborCost ?? '0'),
    travelCost: String(log.travelCost ?? '0'),
    materialsTotal: String(log.materialsTotal ?? '0'),
    expensesTotal: String(log.expensesTotal ?? '0'),
    totalCost: String(log.totalCost ?? '0'),
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
    expenses,
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

// Servis kaydina parca ekler ve stoktan dusurur; birim fiyati anlik katalogdan alir
async function addPartsToServiceLog(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  serviceLogId: string,
  parts: ServicePartInputItem[],
  userId: string,
): Promise<number> {
  if (parts.length === 0) {
    return 0
  }

  const batchItems = []
  let materialsTotal = 0

  for (const part of parts) {
    const product = await getProductOrThrow(part.productId)
    const quantity = parseStockQuantity(part.quantity)
    const unitPrice = parseMoneyAmount(String(product.price))
    const lineTotal = Math.round(unitPrice * quantity * 100) / 100

    await tx.insert(serviceParts).values({
      serviceLogId,
      productId: part.productId,
      quantity: quantity.toFixed(3),
      unitPrice: formatMoneyAmount(unitPrice),
      lineTotal: formatMoneyAmount(lineTotal),
    })

    batchItems.push({ productId: part.productId, quantity })
    materialsTotal += lineTotal
  }

  await stockOutBatchInTransaction(tx, batchItems, userId, `Servis kaydi: ${serviceLogId}`)

  return Math.round(materialsTotal * 100) / 100
}

// Servis kaydina ek masraf satirlari ekler
async function addExpensesToServiceLog(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  serviceLogId: string,
  expenses: { label: string; amount: string }[],
): Promise<number> {
  if (expenses.length === 0) {
    return 0
  }

  let expensesTotal = 0

  for (const expense of expenses) {
    const amount = parseMoneyAmount(expense.amount)
    const label = expense.label.trim()

    if (label.length === 0) {
      throw new AppError('Expense label is required', 422, ERROR_CODES.VALIDATION_ERROR)
    }

    await tx.insert(serviceExpenses).values({
      serviceLogId,
      label,
      amount: formatMoneyAmount(amount),
    })

    expensesTotal += amount
  }

  return Math.round(expensesTotal * 100) / 100
}

// Malzeme, iscilik ve masraf toplamlarini servis kaydina yazar
async function updateServiceLogTotals(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  serviceLogId: string,
  totals: {
    laborCost: number
    travelCost: number
    materialsTotal: number
    expensesTotal: number
  },
): Promise<void> {
  const totalCost =
    totals.laborCost + totals.travelCost + totals.materialsTotal + totals.expensesTotal

  await tx
    .update(serviceLogs)
    .set({
      laborCost: formatMoneyAmount(totals.laborCost),
      travelCost: formatMoneyAmount(totals.travelCost),
      materialsTotal: formatMoneyAmount(totals.materialsTotal),
      expensesTotal: formatMoneyAmount(totals.expensesTotal),
      totalCost: formatMoneyAmount(Math.round(totalCost * 100) / 100),
      updatedAt: new Date(),
    })
    .where(eq(serviceLogs.id, serviceLogId))
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
    laborCost?: string
    travelCost?: string
    expenses?: { label: string; amount: string }[]
  },
  userId: string,
  parts: ServicePartInputItem[] = [],
): Promise<typeof serviceLogs.$inferSelect> {
  const result = input.result ?? SERVICE_LOG_RESULTS.OK
  ensureValidServiceLogResult(result)

  const laborCost = parseMoneyAmount(input.laborCost)
  const travelCost = parseMoneyAmount(input.travelCost)

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
      laborCost: formatMoneyAmount(laborCost),
      travelCost: formatMoneyAmount(travelCost),
      createdBy: userId,
    })
    .returning()

  if (!log) {
    throw new AppError('Failed to create service log', 500, ERROR_CODES.SERVICE_LOG_CREATE_FAILED)
  }

  const materialsTotal = await addPartsToServiceLog(tx, log.id, parts, userId)
  const extraExpensesTotal = await addExpensesToServiceLog(tx, log.id, input.expenses ?? [])

  await updateServiceLogTotals(tx, log.id, {
    laborCost,
    travelCost,
    materialsTotal,
    expensesTotal: extraExpensesTotal,
  })

  const [updatedLog] = await tx
    .select()
    .from(serviceLogs)
    .where(eq(serviceLogs.id, log.id))
    .limit(1)

  return updatedLog ?? log
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
        laborCost: input.laborCost,
        travelCost: input.travelCost,
        expenses: input.expenses,
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
        laborCost: input.laborCost,
        travelCost: input.travelCost,
        expenses: input.expenses,
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

// Is emrine bagli servis kaydini getirir
export async function getServiceLogByWorkOrderId(workOrderId: string): Promise<ServiceLogDto | null> {
  await getWorkOrderOrThrow(workOrderId)

  const [log] = await db
    .select()
    .from(serviceLogs)
    .where(and(eq(serviceLogs.workOrderId, workOrderId), notDeleted(serviceLogs.deletedAt)))
    .orderBy(desc(serviceLogs.createdAt))
    .limit(1)

  if (!log) {
    return null
  }

  return toServiceLogDto(log)
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
