import { and, count, desc, eq, ilike, or } from 'drizzle-orm'
import { ELEVATOR_STATUSES, type ElevatorStatus } from '../constants/elevator.constants'
import { ERROR_CODES } from '../constants/error-codes'
import { db } from '../database'
import { elevators } from '../database/schema'
import type {
  CreateElevatorInput,
  ElevatorDto,
  ElevatorListFilters,
  UpdateElevatorInput,
} from '../types/elevator.types'
import { getSiteForCustomerOrThrow } from './site.service'
import { AppError } from '../utils/errors.util'
import { notDeleted, softDeleteFields } from '../utils/soft-delete.util'

// DB asansor kaydini API yanit formatina cevirir
function toElevatorDto(elevator: typeof elevators.$inferSelect): ElevatorDto {
  return {
    id: elevator.id,
    siteId: elevator.siteId,
    label: elevator.label,
    brand: elevator.brand,
    model: elevator.model,
    serialNumber: elevator.serialNumber,
    capacity: elevator.capacity,
    installedAt: elevator.installedAt,
    status: elevator.status,
    notes: elevator.notes,
    isActive: elevator.isActive,
    createdBy: elevator.createdBy,
    createdAt: elevator.createdAt,
    updatedAt: elevator.updatedAt,
  }
}

// Gecerli asansor durumu kontrolu yapar
function ensureValidElevatorStatus(status: string): asserts status is ElevatorStatus {
  const validStatuses = Object.values(ELEVATOR_STATUSES) as string[]

  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid elevator status', 422, ERROR_CODES.INVALID_ELEVATOR_STATUS)
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

// Seri numarasi tekilligini kontrol eder
async function ensureUniqueSerialNumber(
  serialNumber: string,
  excludeElevatorId?: string,
): Promise<void> {
  const [existing] = await db
    .select({ id: elevators.id })
    .from(elevators)
    .where(and(eq(elevators.serialNumber, serialNumber), notDeleted(elevators.deletedAt)))
    .limit(1)

  if (existing && existing.id !== excludeElevatorId) {
    throw new AppError('Serial number already registered', 409, ERROR_CODES.SERIAL_NUMBER_EXISTS)
  }
}

// Tesis ve asansor eslesmesini dogrular; yoksa 404 firlatir
export async function getElevatorForSiteOrThrow(
  customerId: string,
  siteId: string,
  elevatorId: string,
): Promise<typeof elevators.$inferSelect> {
  await getSiteForCustomerOrThrow(customerId, siteId)

  const [elevator] = await db
    .select()
    .from(elevators)
    .where(
      and(
        eq(elevators.id, elevatorId),
        eq(elevators.siteId, siteId),
        notDeleted(elevators.deletedAt),
      ),
    )
    .limit(1)

  if (!elevator) {
    throw new AppError('Elevator not found', 404, ERROR_CODES.ELEVATOR_NOT_FOUND)
  }

  return elevator
}

// ID ile asansor bulur; yoksa 404 firlatir
export async function getElevatorOrThrow(elevatorId: string): Promise<typeof elevators.$inferSelect> {
  const [elevator] = await db
    .select()
    .from(elevators)
    .where(and(eq(elevators.id, elevatorId), notDeleted(elevators.deletedAt)))
    .limit(1)

  if (!elevator) {
    throw new AppError('Elevator not found', 404, ERROR_CODES.ELEVATOR_NOT_FOUND)
  }

  return elevator
}

// Tesise yeni asansor ekler
export async function createElevator(
  customerId: string,
  siteId: string,
  input: CreateElevatorInput,
  userId: string,
): Promise<ElevatorDto> {
  await getSiteForCustomerOrThrow(customerId, siteId)

  const serialNumber = normalizeOptionalString(input.serialNumber)

  if (serialNumber) {
    await ensureUniqueSerialNumber(serialNumber)
  }

  const status = input.status ?? ELEVATOR_STATUSES.ACTIVE
  ensureValidElevatorStatus(status)

  const [elevator] = await db
    .insert(elevators)
    .values({
      siteId,
      label: input.label.trim(),
      brand: normalizeOptionalString(input.brand) ?? null,
      model: normalizeOptionalString(input.model) ?? null,
      serialNumber: serialNumber ?? null,
      capacity: normalizeOptionalString(input.capacity) ?? null,
      installedAt: input.installedAt ?? null,
      status,
      notes: normalizeOptionalString(input.notes) ?? null,
      isActive: input.isActive ?? true,
      createdBy: userId,
    })
    .returning()

  if (!elevator) {
    throw new AppError('Failed to create elevator', 500, ERROR_CODES.ELEVATOR_CREATE_FAILED)
  }

  return toElevatorDto(elevator)
}

// Tesisin asansor listesini dondurur
export async function listElevatorsBySite(
  customerId: string,
  siteId: string,
  filters: ElevatorListFilters,
): Promise<{
  data: ElevatorDto[]
  pagination: { page: number; limit: number; total: number; pages: number }
}> {
  await getSiteForCustomerOrThrow(customerId, siteId)

  const page = Number(filters.page ?? 1)
  const limit = Number(filters.limit ?? 20)
  const offset = (page - 1) * limit

  const conditions = [eq(elevators.siteId, siteId), notDeleted(elevators.deletedAt)]

  if (filters.status) {
    conditions.push(eq(elevators.status, filters.status))
  }

  if (filters.isActive !== undefined) {
    conditions.push(eq(elevators.isActive, filters.isActive))
  }

  if (filters.search) {
    const term = `%${filters.search}%`
    conditions.push(
      or(
        ilike(elevators.label, term),
        ilike(elevators.brand, term),
        ilike(elevators.model, term),
        ilike(elevators.serialNumber, term),
        ilike(elevators.capacity, term),
        ilike(elevators.notes, term),
      )!,
    )
  }

  const whereClause = and(...conditions)

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(elevators)
      .where(whereClause)
      .orderBy(desc(elevators.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(elevators).where(whereClause),
  ])

  const totalCount = Number(countResult[0]?.total ?? 0)

  return {
    data: rows.map(toElevatorDto),
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit) || 1,
    },
  }
}

// Tek asansor detayini getirir
export async function getElevatorById(
  customerId: string,
  siteId: string,
  elevatorId: string,
): Promise<ElevatorDto> {
  const elevator = await getElevatorForSiteOrThrow(customerId, siteId, elevatorId)
  return toElevatorDto(elevator)
}

// Mevcut asansoru gunceller
export async function updateElevator(
  customerId: string,
  siteId: string,
  elevatorId: string,
  input: UpdateElevatorInput,
): Promise<ElevatorDto> {
  await getElevatorForSiteOrThrow(customerId, siteId, elevatorId)

  if (input.status) {
    ensureValidElevatorStatus(input.status)
  }

  if (input.serialNumber !== undefined) {
    const serialNumber = normalizeOptionalString(input.serialNumber)

    if (serialNumber) {
      await ensureUniqueSerialNumber(serialNumber, elevatorId)
    }
  }

  const [updated] = await db
    .update(elevators)
    .set({
      ...(input.label !== undefined ? { label: input.label.trim() } : {}),
      ...(input.brand !== undefined
        ? { brand: normalizeOptionalString(input.brand) ?? null }
        : {}),
      ...(input.model !== undefined
        ? { model: normalizeOptionalString(input.model) ?? null }
        : {}),
      ...(input.serialNumber !== undefined
        ? { serialNumber: normalizeOptionalString(input.serialNumber) ?? null }
        : {}),
      ...(input.capacity !== undefined
        ? { capacity: normalizeOptionalString(input.capacity) ?? null }
        : {}),
      ...(input.installedAt !== undefined ? { installedAt: input.installedAt ?? null } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: normalizeOptionalString(input.notes) ?? null } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(elevators.id, elevatorId),
        eq(elevators.siteId, siteId),
        notDeleted(elevators.deletedAt),
      ),
    )
    .returning()

  if (!updated) {
    throw new AppError('Elevator not found', 404, ERROR_CODES.ELEVATOR_NOT_FOUND)
  }

  return toElevatorDto(updated)
}

// Asansoru soft delete ile siler
export async function deleteElevator(
  customerId: string,
  siteId: string,
  elevatorId: string,
): Promise<void> {
  await getElevatorForSiteOrThrow(customerId, siteId, elevatorId)

  await db
    .update(elevators)
    .set(softDeleteFields())
    .where(
      and(
        eq(elevators.id, elevatorId),
        eq(elevators.siteId, siteId),
        notDeleted(elevators.deletedAt),
      ),
    )
}

// Tesis silinirken bagli asansorleri soft delete yapar
export async function softDeleteElevatorsBySite(siteId: string): Promise<void> {
  await db
    .update(elevators)
    .set(softDeleteFields())
    .where(and(eq(elevators.siteId, siteId), notDeleted(elevators.deletedAt)))
}
