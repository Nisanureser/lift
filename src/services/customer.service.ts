import { and, count, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { CUSTOMER_TYPES, type CustomerType } from '../constants/customer.constants'
import { ERROR_CODES } from '../constants/error-codes'
import { db } from '../database'
import { customers, sites } from '../database/schema'
import type {
  CreateCustomerInput,
  CustomerDto,
  CustomerListFilters,
  UpdateCustomerInput,
} from '../types/customer.types'
import { AppError } from '../utils/errors.util'

// DB musteri kaydini API yanit formatina cevirir
function toCustomerDto(customer: typeof customers.$inferSelect): CustomerDto {
  const displayName =
    customer.type === CUSTOMER_TYPES.CORPORATE
      ? (customer.companyName ?? '')
      : `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim()

  return {
    id: customer.id,
    type: customer.type,
    displayName,
    firstName: customer.firstName,
    lastName: customer.lastName,
    nationalId: customer.nationalId,
    companyName: customer.companyName,
    taxNumber: customer.taxNumber,
    taxOffice: customer.taxOffice,
    contactPersonName: customer.contactPersonName,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    notes: customer.notes,
    isActive: customer.isActive,
    createdBy: customer.createdBy,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  }
}

// Gecerli musteri tipi kontrolu yapar
function ensureValidCustomerType(type: string): asserts type is CustomerType {
  const validTypes = Object.values(CUSTOMER_TYPES) as string[]

  if (!validTypes.includes(type)) {
    throw new AppError('Invalid customer type', 422, ERROR_CODES.INVALID_CUSTOMER_TYPE)
  }
}

// Opsiyonel string alanlari normalize eder
function normalizeOptionalString(value?: string): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

// Kayit/guncelleme icin ortak alanlari normalize eder
function normalizeSharedFields(input: {
  phone?: string
  email?: string
  address?: string
  notes?: string
}) {
  return {
    phone: normalizeOptionalString(input.phone?.replace(/\s/g, '')),
    email: normalizeOptionalString(input.email?.trim().toLowerCase()),
    address: normalizeOptionalString(input.address),
    notes: normalizeOptionalString(input.notes),
  }
}

// TC kimlik numarasi tekilligini kontrol eder
async function ensureUniqueNationalId(nationalId: string, excludeCustomerId?: string): Promise<void> {
  const [existing] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.nationalId, nationalId))
    .limit(1)

  if (existing && existing.id !== excludeCustomerId) {
    throw new AppError('National ID already registered', 409, ERROR_CODES.NATIONAL_ID_EXISTS)
  }
}

// Vergi numarasi tekilligini kontrol eder
async function ensureUniqueTaxNumber(taxNumber: string, excludeCustomerId?: string): Promise<void> {
  const [existing] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.taxNumber, taxNumber))
    .limit(1)

  if (existing && existing.id !== excludeCustomerId) {
    throw new AppError('Tax number already registered', 409, ERROR_CODES.TAX_NUMBER_EXISTS)
  }
}

// ID ile musteri bulur; yoksa 404 firlatir
export async function getCustomerOrThrow(id: string): Promise<typeof customers.$inferSelect> {
  const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1)

  if (!customer) {
    throw new AppError('Customer not found', 404, ERROR_CODES.CUSTOMER_NOT_FOUND)
  }

  return customer
}

// Yeni musteri olusturur
export async function createCustomer(input: CreateCustomerInput, userId: string): Promise<CustomerDto> {
  ensureValidCustomerType(input.type)

  const shared = normalizeSharedFields(input)

  if (input.type === CUSTOMER_TYPES.INDIVIDUAL) {
    const nationalId = normalizeOptionalString(input.nationalId)

    if (nationalId) {
      await ensureUniqueNationalId(nationalId)
    }

    const [customer] = await db
      .insert(customers)
      .values({
        type: CUSTOMER_TYPES.INDIVIDUAL,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        nationalId: nationalId ?? null,
        phone: shared.phone ?? null,
        email: shared.email ?? null,
        address: shared.address ?? null,
        notes: shared.notes ?? null,
        isActive: input.isActive ?? true,
        createdBy: userId,
      })
      .returning()

    if (!customer) {
      throw new AppError('Failed to create customer', 500, ERROR_CODES.CUSTOMER_CREATE_FAILED)
    }

    return toCustomerDto(customer)
  }

  await ensureUniqueTaxNumber(input.taxNumber.trim())

  const [customer] = await db
    .insert(customers)
    .values({
      type: CUSTOMER_TYPES.CORPORATE,
      companyName: input.companyName.trim(),
      taxNumber: input.taxNumber.trim(),
      taxOffice: input.taxOffice.trim(),
      contactPersonName: normalizeOptionalString(input.contactPersonName) ?? null,
      phone: shared.phone ?? null,
      email: shared.email ?? null,
      address: shared.address ?? null,
      notes: shared.notes ?? null,
      isActive: input.isActive ?? true,
      createdBy: userId,
    })
    .returning()

  if (!customer) {
    throw new AppError('Failed to create customer', 500, ERROR_CODES.CUSTOMER_CREATE_FAILED)
  }

  return toCustomerDto(customer)
}

// Musteri listesini filtre ve sayfalama ile dondurur
export async function listCustomers(filters: CustomerListFilters): Promise<{
  data: CustomerDto[]
  pagination: { page: number; limit: number; total: number; pages: number }
}> {
  const page = Number(filters.page ?? 1)
  const limit = Number(filters.limit ?? 20)
  const offset = (page - 1) * limit

  const conditions = []

  if (filters.type) {
    conditions.push(eq(customers.type, filters.type))
  }

  if (filters.isActive !== undefined) {
    conditions.push(eq(customers.isActive, filters.isActive))
  }

  if (filters.search) {
    const term = `%${filters.search}%`
    conditions.push(
      or(
        ilike(customers.firstName, term),
        ilike(customers.lastName, term),
        ilike(customers.nationalId, term),
        ilike(customers.companyName, term),
        ilike(customers.taxNumber, term),
        ilike(customers.taxOffice, term),
        ilike(customers.contactPersonName, term),
        ilike(customers.phone, term),
        ilike(customers.email, term),
        ilike(sql`concat(${customers.firstName}, ' ', ${customers.lastName})`, term),
      ),
    )
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(customers)
      .where(whereClause)
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(customers).where(whereClause),
  ])

  const totalCount = Number(countResult[0]?.total ?? 0)

  return {
    data: rows.map(toCustomerDto),
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit) || 1,
    },
  }
}

// Tek musteri detayini getirir
export async function getCustomerById(id: string): Promise<CustomerDto> {
  const customer = await getCustomerOrThrow(id)
  return toCustomerDto(customer)
}

// Mevcut musteriyi gunceller
export async function updateCustomer(id: string, input: UpdateCustomerInput): Promise<CustomerDto> {
  const existing = await getCustomerOrThrow(id)

  if (input.type !== undefined) {
    throw new AppError('Customer type cannot be changed', 422, ERROR_CODES.CUSTOMER_TYPE_IMMUTABLE)
  }

  const shared = normalizeSharedFields(input)
  const updates: Partial<typeof customers.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (input.isActive !== undefined) {
    updates.isActive = input.isActive
  }

  if (shared.phone !== undefined) updates.phone = shared.phone
  if (shared.email !== undefined) updates.email = shared.email
  if (shared.address !== undefined) updates.address = shared.address
  if (shared.notes !== undefined) updates.notes = shared.notes

  if (existing.type === CUSTOMER_TYPES.INDIVIDUAL) {
    if (input.firstName !== undefined) updates.firstName = input.firstName.trim()
    if (input.lastName !== undefined) updates.lastName = input.lastName.trim()

    if (input.nationalId !== undefined) {
      const nationalId = normalizeOptionalString(input.nationalId)

      if (nationalId) {
        await ensureUniqueNationalId(nationalId, id)
      }

      updates.nationalId = nationalId ?? null
    }

    if (input.companyName !== undefined || input.taxNumber !== undefined || input.taxOffice !== undefined) {
      throw new AppError('Corporate fields cannot be set on individual customer', 422, ERROR_CODES.VALIDATION_ERROR)
    }
  }

  if (existing.type === CUSTOMER_TYPES.CORPORATE) {
    if (input.companyName !== undefined) updates.companyName = input.companyName.trim()

    if (input.taxNumber !== undefined) {
      const taxNumber = input.taxNumber.trim()
      await ensureUniqueTaxNumber(taxNumber, id)
      updates.taxNumber = taxNumber
    }

    if (input.taxOffice !== undefined) updates.taxOffice = input.taxOffice.trim()

    if (input.contactPersonName !== undefined) {
      updates.contactPersonName = normalizeOptionalString(input.contactPersonName) ?? null
    }

    if (input.firstName !== undefined || input.lastName !== undefined || input.nationalId !== undefined) {
      throw new AppError('Individual fields cannot be set on corporate customer', 422, ERROR_CODES.VALIDATION_ERROR)
    }
  }

  const [updated] = await db.update(customers).set(updates).where(eq(customers.id, id)).returning()

  if (!updated) {
    throw new AppError('Customer not found', 404, ERROR_CODES.CUSTOMER_NOT_FOUND)
  }

  return toCustomerDto(updated)
}

// Musteriyi siler; bagli tesis varsa engeller
export async function deleteCustomer(id: string): Promise<void> {
  await getCustomerOrThrow(id)

  const countResult = await db
    .select({ total: count() })
    .from(sites)
    .where(eq(sites.customerId, id))

  if (Number(countResult[0]?.total ?? 0) > 0) {
    throw new AppError('Customer has linked sites', 409, ERROR_CODES.CUSTOMER_HAS_SITES)
  }

  await db.delete(customers).where(eq(customers.id, id))
}
