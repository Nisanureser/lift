import { count, desc, eq } from 'drizzle-orm'
import { ERROR_CODES } from '../constants/error-codes'
import { STOCK_MOVEMENT_TYPES, type StockMovementType } from '../constants/product.constants'
import { db } from '../database'
import { products, stockMovements } from '../database/schema'
import type {
  StockAdjustInput,
  StockInInput,
  StockMovementDto,
  StockMovementListFilters,
} from '../types/stock.types'
import { AppError } from '../utils/errors.util'

type StockChangeInput = {
  productId: string
  type: StockMovementType
  quantity: number
  userId: string
  note?: string
}

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

export type StockOutBatchItem = {
  productId: string
  quantity: number
}

// Stok miktarini DB'ye yazilacak formata cevirir
function toStockString(value: number): string {
  return value.toFixed(3)
}

// DB stok hareket kaydini API yanit formatina cevirir
function toMovementDto(movement: typeof stockMovements.$inferSelect): StockMovementDto {
  return {
    id: movement.id,
    productId: movement.productId,
    type: movement.type,
    quantity: String(movement.quantity),
    previousStock: String(movement.previousStock),
    newStock: String(movement.newStock),
    note: movement.note,
    createdBy: movement.createdBy,
    createdAt: movement.createdAt,
  }
}

// Stok miktar stringini dogrular ve sayiya cevirir
export function parseStockQuantity(value: string, options?: { allowZero?: boolean; min?: number }): number {
  const num = Number(value)

  if (!Number.isFinite(num) || num < 0) {
    throw new AppError('Invalid stock quantity', 422, ERROR_CODES.INVALID_STOCK_QUANTITY)
  }

  if (!options?.allowZero && num === 0) {
    throw new AppError('Stock quantity must be greater than zero', 422, ERROR_CODES.INVALID_STOCK_QUANTITY)
  }

  if (options?.min !== undefined && num < options.min) {
    throw new AppError('Invalid stock quantity', 422, ERROR_CODES.INVALID_STOCK_QUANTITY)
  }

  return num
}

// Urun stogunu gunceller ve hareket kaydi olusturur (mevcut transaction icinde)
async function applyStockChangeInTransaction(
  tx: DbTransaction,
  input: StockChangeInput,
): Promise<StockMovementDto> {
  const [product] = await tx
    .select()
    .from(products)
    .where(eq(products.id, input.productId))
    .for('update')

  if (!product) {
    throw new AppError('Product not found', 404, ERROR_CODES.PRODUCT_NOT_FOUND)
  }

  const previousStock = Number(product.stockQuantity)
  let newStock = previousStock
  let movementQuantity = input.quantity

  if (input.type === STOCK_MOVEMENT_TYPES.IN) {
    newStock = previousStock + input.quantity
  } else if (input.type === STOCK_MOVEMENT_TYPES.OUT) {
    if (previousStock < input.quantity) {
      throw new AppError('Insufficient stock', 422, ERROR_CODES.INSUFFICIENT_STOCK)
    }
    newStock = previousStock - input.quantity
  } else if (input.type === STOCK_MOVEMENT_TYPES.ADJUSTMENT) {
    movementQuantity = Math.abs(input.quantity - previousStock)
    newStock = input.quantity
  }

  if (newStock < 0) {
    throw new AppError('Insufficient stock', 422, ERROR_CODES.INSUFFICIENT_STOCK)
  }

  await tx
    .update(products)
    .set({
      stockQuantity: toStockString(newStock),
      updatedAt: new Date(),
    })
    .where(eq(products.id, input.productId))

  const [movement] = await tx
    .insert(stockMovements)
    .values({
      productId: input.productId,
      type: input.type,
      quantity: toStockString(movementQuantity),
      previousStock: toStockString(previousStock),
      newStock: toStockString(newStock),
      note: input.note ?? null,
      createdBy: input.userId,
    })
    .returning()

  if (!movement) {
    throw new AppError('Failed to record stock movement', 500, ERROR_CODES.STOCK_MOVEMENT_FAILED)
  }

  return toMovementDto(movement)
}

// Urun stogunu gunceller ve hareket kaydi olusturur
async function applyStockChange(input: StockChangeInput): Promise<StockMovementDto> {
  return db.transaction(async (tx) => applyStockChangeInTransaction(tx, input))
}

// Mevcut transaction icinde stok cikisi yapar
export async function stockOutInTransaction(
  tx: DbTransaction,
  productId: string,
  quantity: number,
  userId: string,
  note?: string,
): Promise<StockMovementDto> {
  return applyStockChangeInTransaction(tx, {
    productId,
    type: STOCK_MOVEMENT_TYPES.OUT,
    quantity,
    userId,
    note,
  })
}

// Birden fazla urun icin stok cikisi yapar (servis parca tuketimi)
export async function stockOutBatchInTransaction(
  tx: DbTransaction,
  items: StockOutBatchItem[],
  userId: string,
  notePrefix: string,
): Promise<StockMovementDto[]> {
  const movements: StockMovementDto[] = []

  for (const item of items) {
    const movement = await applyStockChangeInTransaction(tx, {
      productId: item.productId,
      type: STOCK_MOVEMENT_TYPES.OUT,
      quantity: item.quantity,
      userId,
      note: notePrefix,
    })
    movements.push(movement)
  }

  return movements
}

// Stok girisi yapar
export async function stockIn(
  productId: string,
  input: StockInInput,
  userId: string,
): Promise<StockMovementDto> {
  const quantity = parseStockQuantity(input.quantity)

  return applyStockChange({
    productId,
    type: STOCK_MOVEMENT_TYPES.IN,
    quantity,
    userId,
    note: input.note,
  })
}

// Stok cikisi yapar
export async function stockOut(
  productId: string,
  input: StockInInput,
  userId: string,
): Promise<StockMovementDto> {
  const quantity = parseStockQuantity(input.quantity)

  return applyStockChange({
    productId,
    type: STOCK_MOVEMENT_TYPES.OUT,
    quantity,
    userId,
    note: input.note,
  })
}

// Stok miktarini belirli bir degere ayarlar (sayim duzeltmesi)
export async function adjustStock(
  productId: string,
  input: StockAdjustInput,
  userId: string,
): Promise<StockMovementDto> {
  const quantity = parseStockQuantity(input.quantity, { allowZero: true })

  return applyStockChange({
    productId,
    type: STOCK_MOVEMENT_TYPES.ADJUSTMENT,
    quantity,
    userId,
    note: input.note,
  })
}

// Urun stok hareket gecmisini listeler
export async function listStockMovements(
  productId: string,
  filters: StockMovementListFilters,
): Promise<{
  data: StockMovementDto[]
  pagination: { page: number; limit: number; total: number; pages: number }
}> {
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)

  if (!product) {
    throw new AppError('Product not found', 404, ERROR_CODES.PRODUCT_NOT_FOUND)
  }

  const page = Number(filters.page ?? 1)
  const limit = Number(filters.limit ?? 20)
  const offset = (page - 1) * limit

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.productId, productId))
      .orderBy(desc(stockMovements.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(stockMovements).where(eq(stockMovements.productId, productId)),
  ])

  const totalCount = Number(countResult[0]?.total ?? 0)

  return {
    data: rows.map(toMovementDto),
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit) || 1,
    },
  }
}
