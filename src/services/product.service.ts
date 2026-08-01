import { and, count, desc, eq, ilike, or } from 'drizzle-orm'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { env } from '../config/env'
import { ERROR_CODES } from '../constants/error-codes'
import { MAX_IMAGES_PER_PRODUCT, PRODUCT_UNITS, type ProductUnit } from '../constants/product.constants'
import { db } from '../database'
import { categories, productImages, products } from '../database/schema'
import type {
  CreateProductInput,
  ProductDto,
  ProductImageDto,
  ProductListFilters,
  ProductListItemDto,
  UpdateProductInput,
} from '../types/product.types'
import { ensureActiveCategory, getCategoryOrThrow } from './category.service'
import { parseStockQuantity, stockIn } from './stock.service'
import { AppError } from '../utils/errors.util'
import { buildImageFileName, ensureProductUploadDir, toPublicFileUrl, validateImageFile } from '../utils/file.util'

// DB fotograf kaydini API yanit formatina cevirir
function toImageDto(image: typeof productImages.$inferSelect): ProductImageDto {
  return {
    id: image.id,
    url: toPublicFileUrl(image.filePath),
    fileName: image.fileName,
    mimeType: image.mimeType,
    isPrimary: image.isPrimary,
    sortOrder: image.sortOrder,
    createdAt: image.createdAt,
  }
}

// Urun ve kategori bilgisini detayli formatta dondurur
async function toProductDto(product: typeof products.$inferSelect): Promise<ProductDto> {
  const category = await getCategoryOrThrow(product.categoryId)

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(desc(productImages.isPrimary), productImages.sortOrder)

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    price: String(product.price),
    unit: product.unit,
    stockQuantity: String(product.stockQuantity),
    categoryId: product.categoryId,
    category: {
      id: category.id,
      name: category.name,
      isActive: category.isActive,
    },
    isActive: product.isActive,
    createdBy: product.createdBy,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    images: images.map(toImageDto),
  }
}

// ID ile urun bulur; yoksa 404 firlatir
export async function getProductOrThrow(id: string): Promise<typeof products.$inferSelect> {
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1)

  if (!product) {
    throw new AppError('Product not found', 404, ERROR_CODES.PRODUCT_NOT_FOUND)
  }

  return product
}

// SKU benzersizligini kontrol eder
async function ensureUniqueSku(sku: string, excludeProductId?: string): Promise<void> {
  const [existing] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.sku, sku))
    .limit(1)

  if (existing && existing.id !== excludeProductId) {
    throw new AppError('SKU already exists', 409, ERROR_CODES.SKU_EXISTS)
  }
}

// Gecerli olcu birimi kontrolu yapar
function ensureValidUnit(unit: string): asserts unit is ProductUnit {
  const validUnits = Object.values(PRODUCT_UNITS) as string[]

  if (!validUnits.includes(unit)) {
    throw new AppError('Invalid product unit', 422, ERROR_CODES.INVALID_UNIT)
  }
}

// Yeni urun olusturur; istege bagli fotograflari da ayni akista yukler
export async function createProduct(
  input: CreateProductInput,
  userId: string,
  imageFiles: File[] = [],
): Promise<ProductDto> {
  await ensureActiveCategory(input.categoryId)
  ensureValidUnit(input.unit)
  await ensureUniqueSku(input.sku)

  const [product] = await db
    .insert(products)
    .values({
      sku: input.sku.trim(),
      name: input.name,
      description: input.description,
      price: input.price,
      unit: input.unit,
      stockQuantity: '0',
      categoryId: input.categoryId,
      isActive: input.isActive ?? true,
      createdBy: userId,
    })
    .returning()

  if (!product) {
    throw new AppError('Failed to create product', 500, ERROR_CODES.PRODUCT_CREATE_FAILED)
  }

  if (input.initialStock) {
    const initialStock = parseStockQuantity(input.initialStock, { allowZero: true })

    if (initialStock > 0) {
      await stockIn(product.id, { quantity: input.initialStock, note: 'Initial stock' }, userId)
    }
  }

  if (imageFiles.length > 0) {
    await uploadProductImages(product.id, imageFiles)
  }

  return getProductById(product.id)
}

// Urun listesini filtre ve sayfalama ile dondurur
export async function listProducts(filters: ProductListFilters): Promise<{
  data: ProductListItemDto[]
  pagination: { page: number; limit: number; total: number; pages: number }
}> {
  const page = Number(filters.page ?? 1)
  const limit = Number(filters.limit ?? 20)
  const offset = (page - 1) * limit

  const conditions = []

  if (filters.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId))
  }

  if (filters.isActive !== undefined) {
    conditions.push(eq(products.isActive, filters.isActive))
  }

  if (filters.search) {
    conditions.push(
      or(
        ilike(products.name, `%${filters.search}%`),
        ilike(products.sku, `%${filters.search}%`),
        ilike(products.description, `%${filters.search}%`),
      ),
    )
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [rows, countResult] = await Promise.all([
    db
      .select({
        product: products,
        categoryName: categories.name,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(products).where(whereClause),
  ])

  const totalCount = Number(countResult[0]?.total ?? 0)

  const data: ProductListItemDto[] = await Promise.all(
    rows.map(async ({ product, categoryName }) => {
      const [primaryImage] = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(desc(productImages.isPrimary), productImages.sortOrder)
        .limit(1)

      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        price: String(product.price),
        unit: product.unit,
        stockQuantity: String(product.stockQuantity),
        categoryId: product.categoryId,
        categoryName,
        isActive: product.isActive,
        primaryImage: primaryImage ? toImageDto(primaryImage) : null,
        createdAt: product.createdAt,
      }
    }),
  )

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

// Tek urun detayini getirir
export async function getProductById(id: string): Promise<ProductDto> {
  const product = await getProductOrThrow(id)
  return toProductDto(product)
}

// Mevcut urunu gunceller; fotograf silebilir ve yeni fotograf ekleyebilir
export async function updateProduct(
  id: string,
  input: UpdateProductInput,
  imageFiles: File[] = [],
  removeImageIds: string[] = [],
): Promise<ProductDto> {
  await getProductOrThrow(id)

  const uniqueRemoveIds = [...new Set(removeImageIds)]

  for (const imageId of uniqueRemoveIds) {
    await deleteProductImage(id, imageId)
  }

  if (input.categoryId) {
    await ensureActiveCategory(input.categoryId)
  }

  if (input.sku) {
    await ensureUniqueSku(input.sku.trim(), id)
  }

  if (input.unit) {
    ensureValidUnit(input.unit)
  }

  const [updated] = await db
    .update(products)
    .set({
      ...(input.sku ? { sku: input.sku.trim() } : {}),
      ...(input.name ? { name: input.name } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.unit ? { unit: input.unit } : {}),
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning()

  if (!updated) {
    throw new AppError('Product not found', 404, ERROR_CODES.PRODUCT_NOT_FOUND)
  }

  if (imageFiles.length > 0) {
    await uploadProductImages(id, imageFiles)
  }

  return getProductById(id)
}

// Urunu ve tum fotograflarini siler
export async function deleteProduct(id: string): Promise<void> {
  await getProductOrThrow(id)

  const images = await db.select().from(productImages).where(eq(productImages.productId, id))

  await db.delete(products).where(eq(products.id, id))

  await Promise.all(
    images.map(async (image) => {
      try {
        await unlink(join(env.UPLOAD_DIR, image.filePath))
      } catch {
        // Dosya zaten silinmis olabilir
      }
    }),
  )
}

// Uruna tek fotograf kaydeder
async function saveProductImage(productId: string, file: File, isPrimary: boolean): Promise<void> {
  validateImageFile(file)

  const fileName = buildImageFileName(file.name)
  const relativePath = join('products', productId, fileName)
  const absolutePath = join(env.UPLOAD_DIR, relativePath)

  await ensureProductUploadDir(productId)
  await Bun.write(absolutePath, file)

  if (isPrimary) {
    await db
      .update(productImages)
      .set({ isPrimary: false })
      .where(eq(productImages.productId, productId))
  }

  const countResult = await db
    .select({ total: count() })
    .from(productImages)
    .where(eq(productImages.productId, productId))

  const nextSortOrder = Number(countResult[0]?.total ?? 0) + 1

  const [image] = await db
    .insert(productImages)
    .values({
      productId,
      fileName,
      filePath: relativePath.replace(/\\/g, '/'),
      mimeType: file.type,
      isPrimary,
      sortOrder: nextSortOrder,
    })
    .returning()

  if (!image) {
    throw new AppError('Failed to upload image', 500, ERROR_CODES.PRODUCT_IMAGE_NOT_FOUND)
  }
}

// Uruna birden fazla fotograf yukler
async function uploadProductImages(productId: string, files: File[]): Promise<void> {
  if (files.length === 0) {
    return
  }

  const existingCount = await db
    .select({ total: count() })
    .from(productImages)
    .where(eq(productImages.productId, productId))

  const currentTotal = Number(existingCount[0]?.total ?? 0)

  if (currentTotal + files.length > MAX_IMAGES_PER_PRODUCT) {
    throw new AppError(
      `Maximum ${MAX_IMAGES_PER_PRODUCT} images allowed per product`,
      422,
      ERROR_CODES.TOO_MANY_IMAGES,
    )
  }

  const hasPrimaryRows = await db
    .select({ id: productImages.id })
    .from(productImages)
    .where(and(eq(productImages.productId, productId), eq(productImages.isPrimary, true)))
    .limit(1)

  let hasPrimaryImage = hasPrimaryRows.length > 0

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    if (!file) continue

    const makePrimary = !hasPrimaryImage && index === 0
    await saveProductImage(productId, file, makePrimary)

    if (makePrimary) {
      hasPrimaryImage = true
    }
  }
}

// Urun fotografini siler
async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  const [image] = await db
    .select()
    .from(productImages)
    .where(and(eq(productImages.id, imageId), eq(productImages.productId, productId)))
    .limit(1)

  if (!image) {
    throw new AppError('Product image not found', 404, ERROR_CODES.PRODUCT_IMAGE_NOT_FOUND)
  }

  await db.delete(productImages).where(eq(productImages.id, imageId))

  try {
    await unlink(join(env.UPLOAD_DIR, image.filePath))
  } catch {
    // Dosya zaten silinmis olabilir
  }
}
