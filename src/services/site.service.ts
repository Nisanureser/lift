import { and, count, desc, eq, ilike, or } from 'drizzle-orm'
import { ERROR_CODES } from '../constants/error-codes'
import { db } from '../database'
import { sites } from '../database/schema'
import type { CreateSiteInput, SiteDto, SiteListFilters, UpdateSiteInput } from '../types/site.types'
import { getCustomerOrThrow } from './customer.service'
import { softDeleteElevatorsBySite } from './elevator.service'
import { AppError } from '../utils/errors.util'
import { notDeleted, softDeleteFields } from '../utils/soft-delete.util'

// DB tesis kaydini API yanit formatina cevirir
function toSiteDto(site: typeof sites.$inferSelect): SiteDto {
  return {
    id: site.id,
    customerId: site.customerId,
    name: site.name,
    address: site.address,
    city: site.city,
    district: site.district,
    contactName: site.contactName,
    contactPhone: site.contactPhone,
    notes: site.notes,
    isActive: site.isActive,
    createdBy: site.createdBy,
    createdAt: site.createdAt,
    updatedAt: site.updatedAt,
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

// Musteri ve tesis eslesmesini dogrular; yoksa 404 firlatir
export async function getSiteForCustomerOrThrow(
  customerId: string,
  siteId: string,
): Promise<typeof sites.$inferSelect> {
  await getCustomerOrThrow(customerId)

  const [site] = await db
    .select()
    .from(sites)
    .where(
      and(eq(sites.id, siteId), eq(sites.customerId, customerId), notDeleted(sites.deletedAt)),
    )
    .limit(1)

  if (!site) {
    throw new AppError('Site not found', 404, ERROR_CODES.SITE_NOT_FOUND)
  }

  return site
}

// Musteriye yeni tesis ekler
export async function createSite(
  customerId: string,
  input: CreateSiteInput,
  userId: string,
): Promise<SiteDto> {
  await getCustomerOrThrow(customerId)

  const contactPhone = normalizeOptionalString(input.contactPhone?.replace(/\s/g, ''))

  const [site] = await db
    .insert(sites)
    .values({
      customerId,
      name: input.name.trim(),
      address: input.address.trim(),
      city: input.city.trim(),
      district: input.district.trim(),
      contactName: normalizeOptionalString(input.contactName) ?? null,
      contactPhone: contactPhone ?? null,
      notes: normalizeOptionalString(input.notes) ?? null,
      isActive: input.isActive ?? true,
      createdBy: userId,
    })
    .returning()

  if (!site) {
    throw new AppError('Failed to create site', 500, ERROR_CODES.SITE_CREATE_FAILED)
  }

  return toSiteDto(site)
}

// Musterinin tesis listesini dondurur
export async function listSitesByCustomer(
  customerId: string,
  filters: SiteListFilters,
): Promise<{
  data: SiteDto[]
  pagination: { page: number; limit: number; total: number; pages: number }
}> {
  await getCustomerOrThrow(customerId)

  const page = Number(filters.page ?? 1)
  const limit = Number(filters.limit ?? 20)
  const offset = (page - 1) * limit

  const conditions = [eq(sites.customerId, customerId), notDeleted(sites.deletedAt)]

  if (filters.isActive !== undefined) {
    conditions.push(eq(sites.isActive, filters.isActive))
  }

  if (filters.search) {
    const term = `%${filters.search}%`
    conditions.push(
      or(
        ilike(sites.name, term),
        ilike(sites.address, term),
        ilike(sites.city, term),
        ilike(sites.district, term),
        ilike(sites.contactName, term),
        ilike(sites.contactPhone, term),
        ilike(sites.notes, term),
      )!,
    )
  }

  const whereClause = and(...conditions)

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(sites)
      .where(whereClause)
      .orderBy(desc(sites.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(sites).where(whereClause),
  ])

  const totalCount = Number(countResult[0]?.total ?? 0)

  return {
    data: rows.map(toSiteDto),
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit) || 1,
    },
  }
}

// Tek tesis detayini getirir
export async function getSiteById(customerId: string, siteId: string): Promise<SiteDto> {
  const site = await getSiteForCustomerOrThrow(customerId, siteId)
  return toSiteDto(site)
}

// Mevcut tesisi gunceller
export async function updateSite(
  customerId: string,
  siteId: string,
  input: UpdateSiteInput,
): Promise<SiteDto> {
  await getSiteForCustomerOrThrow(customerId, siteId)

  const contactPhone =
    input.contactPhone !== undefined
      ? normalizeOptionalString(input.contactPhone.replace(/\s/g, ''))
      : undefined

  const [updated] = await db
    .update(sites)
    .set({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.address !== undefined ? { address: input.address.trim() } : {}),
      ...(input.city !== undefined ? { city: input.city.trim() } : {}),
      ...(input.district !== undefined ? { district: input.district.trim() } : {}),
      ...(input.contactName !== undefined
        ? { contactName: normalizeOptionalString(input.contactName) ?? null }
        : {}),
      ...(contactPhone !== undefined ? { contactPhone: contactPhone ?? null } : {}),
      ...(input.notes !== undefined ? { notes: normalizeOptionalString(input.notes) ?? null } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(sites.id, siteId),
        eq(sites.customerId, customerId),
        notDeleted(sites.deletedAt),
      ),
    )
    .returning()

  if (!updated) {
    throw new AppError('Site not found', 404, ERROR_CODES.SITE_NOT_FOUND)
  }

  return toSiteDto(updated)
}

// Tesisi ve bagli asansorleri soft delete ile siler
export async function deleteSite(customerId: string, siteId: string): Promise<void> {
  await getSiteForCustomerOrThrow(customerId, siteId)
  await softDeleteElevatorsBySite(siteId)

  await db
    .update(sites)
    .set(softDeleteFields())
    .where(
      and(
        eq(sites.id, siteId),
        eq(sites.customerId, customerId),
        notDeleted(sites.deletedAt),
      ),
    )
}

// Musterinin silinmemis tesis sayisini dondurur
export async function countSitesByCustomer(customerId: string): Promise<number> {
  const result = await db
    .select({ total: count() })
    .from(sites)
    .where(and(eq(sites.customerId, customerId), notDeleted(sites.deletedAt)))

  return Number(result[0]?.total ?? 0)
}
