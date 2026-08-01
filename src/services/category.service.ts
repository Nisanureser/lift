import { and, count, desc, eq, ilike, or } from 'drizzle-orm'
import { ERROR_CODES } from '../constants/error-codes'
import { db } from '../database'
import { categories, products } from '../database/schema'
import type {
  CategoryDto,
  CategoryListFilters,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../types/category.types'
import { AppError } from '../utils/errors.util'
import { notDeleted, softDeleteFields } from '../utils/soft-delete.util'

// DB kategori kaydini API yanit formatina cevirir
function toCategoryDto(category: typeof categories.$inferSelect): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  }
}

// ID ile kategori bulur; yoksa 404 firlatir
export async function getCategoryOrThrow(id: string): Promise<typeof categories.$inferSelect> {
  const [category] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), notDeleted(categories.deletedAt)))
    .limit(1)

  if (!category) {
    throw new AppError('Category not found', 404, ERROR_CODES.CATEGORY_NOT_FOUND)
  }

  return category
}

// Aktif kategori kontrolu yapar (urun olusturma/guncelleme icin)
export async function ensureActiveCategory(categoryId: string): Promise<void> {
  const category = await getCategoryOrThrow(categoryId)

  if (!category.isActive) {
    throw new AppError('Category is not active', 422, ERROR_CODES.CATEGORY_NOT_FOUND)
  }
}

// Yeni kategori olusturur
export async function createCategory(input: CreateCategoryInput): Promise<CategoryDto> {
  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.name, input.name), notDeleted(categories.deletedAt)))
    .limit(1)

  if (existing) {
    throw new AppError('Category name already exists', 409, ERROR_CODES.CATEGORY_EXISTS)
  }

  const [category] = await db
    .insert(categories)
    .values({
      name: input.name,
      description: input.description,
      isActive: input.isActive ?? true,
    })
    .returning()

  if (!category) {
    throw new AppError('Failed to create category', 500, ERROR_CODES.CATEGORY_CREATE_FAILED)
  }

  return toCategoryDto(category)
}

// Kategori listesini filtre ve sayfalama ile dondurur
export async function listCategories(filters: CategoryListFilters): Promise<{
  data: CategoryDto[]
  pagination: { page: number; limit: number; total: number; pages: number }
}> {
  const page = Number(filters.page ?? 1)
  const limit = Number(filters.limit ?? 20)
  const offset = (page - 1) * limit

  const conditions = [notDeleted(categories.deletedAt)]

  if (filters.isActive !== undefined) {
    conditions.push(eq(categories.isActive, filters.isActive))
  }

  if (filters.search) {
    conditions.push(
      or(
        ilike(categories.name, `%${filters.search}%`),
        ilike(categories.description, `%${filters.search}%`),
      ),
    )
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(categories)
      .where(whereClause)
      .orderBy(desc(categories.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(categories).where(whereClause),
  ])

  const totalCount = Number(countResult[0]?.total ?? 0)

  return {
    data: rows.map(toCategoryDto),
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit) || 1,
    },
  }
}

// Tek kategori detayini getirir
export async function getCategoryById(id: string): Promise<CategoryDto> {
  const category = await getCategoryOrThrow(id)
  return toCategoryDto(category)
}

// Mevcut kategoriyi gunceller
export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<CategoryDto> {
  await getCategoryOrThrow(id)

  if (input.name) {
    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.name, input.name), notDeleted(categories.deletedAt)))
      .limit(1)

    if (existing && existing.id !== id) {
      throw new AppError('Category name already exists', 409, ERROR_CODES.CATEGORY_EXISTS)
    }
  }

  const [updated] = await db
    .update(categories)
    .set({
      ...(input.name ? { name: input.name } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(categories.id, id), notDeleted(categories.deletedAt)))
    .returning()

  if (!updated) {
    throw new AppError('Category not found', 404, ERROR_CODES.CATEGORY_NOT_FOUND)
  }

  return toCategoryDto(updated)
}

// Kategoriyi siler; bagli urun varsa engeller
export async function deleteCategory(id: string): Promise<void> {
  await getCategoryOrThrow(id)

  const countResult = await db
    .select({ total: count() })
    .from(products)
    .where(and(eq(products.categoryId, id), notDeleted(products.deletedAt)))

  if (Number(countResult[0]?.total ?? 0) > 0) {
    throw new AppError('Category has linked products', 409, ERROR_CODES.CATEGORY_HAS_PRODUCTS)
  }

  await db
    .update(categories)
    .set(softDeleteFields())
    .where(and(eq(categories.id, id), notDeleted(categories.deletedAt)))
}
