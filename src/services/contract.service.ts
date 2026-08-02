import { and, count, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm'
import { CONTRACT_TYPES, VISIT_FREQUENCIES, type ContractType, type VisitFrequency } from '../constants/contract.constants'
import { CUSTOMER_TYPES } from '../constants/customer.constants'
import { ERROR_CODES } from '../constants/error-codes'
import { db } from '../database'
import { contracts, customers, elevators, sites } from '../database/schema'
import type {
  ContractDto,
  ContractListFilters,
  CreateContractInput,
  UpdateContractInput,
} from '../types/work-order.types'
import { getCustomerOrThrow } from './customer.service'
import { getElevatorForSiteOrThrow, getElevatorOrThrow } from './elevator.service'
import { getSiteForCustomerOrThrow } from './site.service'
import { AppError } from '../utils/errors.util'
import { notDeleted, softDeleteFields } from '../utils/soft-delete.util'

// DB sozlesme kaydini API yanit formatina cevirir
function toContractDto(contract: typeof contracts.$inferSelect): ContractDto {
  return {
    id: contract.id,
    customerId: contract.customerId,
    siteId: contract.siteId,
    elevatorId: contract.elevatorId,
    type: contract.type,
    startDate: contract.startDate,
    endDate: contract.endDate,
    visitFrequency: contract.visitFrequency,
    notes: contract.notes,
    isActive: contract.isActive,
    createdBy: contract.createdBy,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
  }
}

// Gecerli sozlesme tipi kontrolu yapar
function ensureValidContractType(type: string): asserts type is ContractType {
  const valid = Object.values(CONTRACT_TYPES) as string[]

  if (!valid.includes(type)) {
    throw new AppError('Invalid contract type', 422, ERROR_CODES.INVALID_CONTRACT_TYPE)
  }
}

// Gecerli ziyaret sikligi kontrolu yapar
function ensureValidVisitFrequency(frequency: string): asserts frequency is VisitFrequency {
  const valid = Object.values(VISIT_FREQUENCIES) as string[]

  if (!valid.includes(frequency)) {
    throw new AppError('Invalid visit frequency', 422, ERROR_CODES.INVALID_VISIT_FREQUENCY)
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

// Sozlesme kapsamindaki site ve asansor uyumunu dogrular
async function validateContractScope(
  customerId: string,
  siteId?: string | null,
  elevatorId?: string | null,
): Promise<void> {
  if (elevatorId) {
    if (!siteId) {
      throw new AppError('Elevator scope requires site', 422, ERROR_CODES.INVALID_CONTRACT_SCOPE)
    }

    await getElevatorForSiteOrThrow(customerId, siteId, elevatorId)
    return
  }

  if (siteId) {
    await getSiteForCustomerOrThrow(customerId, siteId)
  }
}

// Musteri ve sozlesme eslesmesini dogrular; yoksa 404 firlatir
export async function getContractForCustomerOrThrow(
  customerId: string,
  contractId: string,
): Promise<typeof contracts.$inferSelect> {
  await getCustomerOrThrow(customerId)

  const [contract] = await db
    .select()
    .from(contracts)
    .where(
      and(
        eq(contracts.id, contractId),
        eq(contracts.customerId, customerId),
        notDeleted(contracts.deletedAt),
      ),
    )
    .limit(1)

  if (!contract) {
    throw new AppError('Contract not found', 404, ERROR_CODES.CONTRACT_NOT_FOUND)
  }

  return contract
}

// ID ile sozlesme bulur; yoksa 404 firlatir
export async function getContractOrThrow(contractId: string): Promise<typeof contracts.$inferSelect> {
  const [contract] = await db
    .select()
    .from(contracts)
    .where(and(eq(contracts.id, contractId), notDeleted(contracts.deletedAt)))
    .limit(1)

  if (!contract) {
    throw new AppError('Contract not found', 404, ERROR_CODES.CONTRACT_NOT_FOUND)
  }

  return contract
}

// Musteriye yeni sozlesme ekler
export async function createContract(
  customerId: string,
  input: CreateContractInput,
  userId: string,
): Promise<ContractDto> {
  await getCustomerOrThrow(customerId)
  ensureValidContractType(input.type)
  ensureValidVisitFrequency(input.visitFrequency)
  await validateContractScope(customerId, input.siteId, input.elevatorId)

  const [contract] = await db
    .insert(contracts)
    .values({
      customerId,
      siteId: input.siteId ?? null,
      elevatorId: input.elevatorId ?? null,
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      visitFrequency: input.visitFrequency,
      notes: normalizeOptionalString(input.notes) ?? null,
      isActive: input.isActive ?? true,
      createdBy: userId,
    })
    .returning()

  if (!contract) {
    throw new AppError('Failed to create contract', 500, ERROR_CODES.CONTRACT_CREATE_FAILED)
  }

  return toContractDto(contract)
}

// Musteri sozlesmelerini listeler
export async function listContractsByCustomer(
  customerId: string,
  filters: ContractListFilters,
): Promise<{
  data: ContractDto[]
  pagination: { page: number; limit: number; total: number; pages: number }
}> {
  await getCustomerOrThrow(customerId)

  const page = Number(filters.page ?? 1)
  const limit = Number(filters.limit ?? 20)
  const offset = (page - 1) * limit

  const conditions = [eq(contracts.customerId, customerId), notDeleted(contracts.deletedAt)]

  if (filters.type) {
    conditions.push(eq(contracts.type, filters.type))
  }

  if (filters.isActive !== undefined) {
    conditions.push(eq(contracts.isActive, filters.isActive))
  }

  if (filters.search) {
    const term = `%${filters.search}%`
    conditions.push(or(ilike(contracts.notes, term), ilike(contracts.type, term))!)
  }

  const whereClause = and(...conditions)

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(contracts)
      .where(whereClause)
      .orderBy(desc(contracts.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(contracts).where(whereClause),
  ])

  const totalCount = Number(countResult[0]?.total ?? 0)

  return {
    data: rows.map(toContractDto),
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit) || 1,
    },
  }
}

// Sozlesme detayini getirir
export async function getContractById(
  customerId: string,
  contractId: string,
): Promise<ContractDto> {
  const contract = await getContractForCustomerOrThrow(customerId, contractId)
  return toContractDto(contract)
}

// Sozlesmeyi gunceller
export async function updateContract(
  customerId: string,
  contractId: string,
  input: UpdateContractInput,
): Promise<ContractDto> {
  await getContractForCustomerOrThrow(customerId, contractId)

  if (input.type) {
    ensureValidContractType(input.type)
  }

  if (input.visitFrequency) {
    ensureValidVisitFrequency(input.visitFrequency)
  }

  const nextSiteId = input.siteId !== undefined ? input.siteId : undefined
  const nextElevatorId = input.elevatorId !== undefined ? input.elevatorId : undefined

  if (nextSiteId !== undefined || nextElevatorId !== undefined) {
    const current = await getContractForCustomerOrThrow(customerId, contractId)
    await validateContractScope(
      customerId,
      nextSiteId !== undefined ? nextSiteId : current.siteId,
      nextElevatorId !== undefined ? nextElevatorId : current.elevatorId,
    )
  }

  const [updated] = await db
    .update(contracts)
    .set({
      ...(input.siteId !== undefined ? { siteId: input.siteId } : {}),
      ...(input.elevatorId !== undefined ? { elevatorId: input.elevatorId } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
      ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
      ...(input.visitFrequency !== undefined ? { visitFrequency: input.visitFrequency } : {}),
      ...(input.notes !== undefined ? { notes: normalizeOptionalString(input.notes) ?? null } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(contracts.id, contractId),
        eq(contracts.customerId, customerId),
        notDeleted(contracts.deletedAt),
      ),
    )
    .returning()

  if (!updated) {
    throw new AppError('Contract not found', 404, ERROR_CODES.CONTRACT_NOT_FOUND)
  }

  return toContractDto(updated)
}

// Sozlesmeyi soft delete ile siler
export async function deleteContract(customerId: string, contractId: string): Promise<void> {
  await getContractForCustomerOrThrow(customerId, contractId)

  await db
    .update(contracts)
    .set(softDeleteFields())
    .where(
      and(
        eq(contracts.id, contractId),
        eq(contracts.customerId, customerId),
        notDeleted(contracts.deletedAt),
      ),
    )
}

// Sozlesmenin musteriye ait oldugunu dogrular (is emri icin)
export async function ensureContractBelongsToCustomer(
  contractId: string,
  customerId: string,
): Promise<void> {
  const contract = await getContractOrThrow(contractId)

  if (contract.customerId !== customerId) {
    throw new AppError('Contract not found', 404, ERROR_CODES.CONTRACT_NOT_FOUND)
  }
}

// Asansorun bagli oldugu musteri ID'sini dondurur
export async function getCustomerIdForElevator(elevatorId: string): Promise<string> {
  await getElevatorOrThrow(elevatorId)

  const [row] = await db
    .select({ customerId: sites.customerId })
    .from(elevators)
    .innerJoin(sites, eq(elevators.siteId, sites.id))
    .where(and(eq(elevators.id, elevatorId), notDeleted(elevators.deletedAt), notDeleted(sites.deletedAt)))
    .limit(1)

  if (!row) {
    throw new AppError('Elevator not found', 404, ERROR_CODES.ELEVATOR_NOT_FOUND)
  }

  return row.customerId
}

// Musteri goruntuleme adini SQL ifadesi olarak uretir
export function customerDisplayNameSql() {
  return sql<string>`CASE WHEN ${customers.type} = ${CUSTOMER_TYPES.CORPORATE} THEN COALESCE(${customers.companyName}, '') ELSE TRIM(CONCAT(COALESCE(${customers.firstName}, ''), ' ', COALESCE(${customers.lastName}, ''))) END`
}
