import type { SafeUser } from '../types/auth.types'
import type { CreateProductInput, ProductListFilters, UpdateProductInput } from '../types/product.types'
import type { StockAdjustInput, StockInInput, StockMovementListFilters } from '../types/stock.types'
import {
  createProduct,
  deleteProduct,
  deleteProductImage,
  getProductById,
  listProducts,
  updateProduct,
  uploadProductImages,
} from '../services/product.service'
import { adjustStock, listStockMovements, stockIn, stockOut } from '../services/stock.service'
import { runController } from '../utils/controller.util'

// Asansor urunlerini listeler
export async function list({ query }: { query: ProductListFilters }) {
  return listProducts(query)
}

// Tek urun detayini getirir
export async function getById({
  params,
  set,
}: {
  params: { id: string }
  set: { status?: number | string }
}) {
  return runController(set, async () => getProductById(params.id))
}

// Yeni asansor urunu olusturur
export async function create({
  body,
  user,
  set,
}: {
  body: CreateProductInput
  user: SafeUser
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    const product = await createProduct(body, user.id)
    set.status = 201
    return product
  })
}

// Mevcut urunu gunceller
export async function update({
  params,
  body,
  set,
}: {
  params: { id: string }
  body: UpdateProductInput
  set: { status?: number | string }
}) {
  return runController(set, async () => updateProduct(params.id, body))
}

// Urunu siler
export async function remove({
  params,
  set,
}: {
  params: { id: string }
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    await deleteProduct(params.id)
    set.status = 204
    return null
  })
}

// Uruna birden fazla fotograf yukler
export async function uploadImages({
  params,
  body,
  set,
}: {
  params: { id: string }
  body: { images: File | File[] }
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    const files = Array.isArray(body.images) ? body.images : [body.images]
    const result = await uploadProductImages(params.id, files)
    set.status = 201
    return result
  })
}

// Urun fotografini siler
export async function removeImage({
  params,
  set,
}: {
  params: { id: string; imageId: string }
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    await deleteProductImage(params.id, params.imageId)
    set.status = 204
    return null
  })
}

// Urun stok girisi yapar
export async function addStock({
  params,
  body,
  user,
  set,
}: {
  params: { id: string }
  body: StockInInput
  user: SafeUser
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    const movement = await stockIn(params.id, body, user.id)
    set.status = 201
    return movement
  })
}

// Urun stok cikisi yapar
export async function removeStock({
  params,
  body,
  user,
  set,
}: {
  params: { id: string }
  body: StockInInput
  user: SafeUser
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    const movement = await stockOut(params.id, body, user.id)
    set.status = 201
    return movement
  })
}

// Urun stok miktarini duzeltir
export async function adjustProductStock({
  params,
  body,
  user,
  set,
}: {
  params: { id: string }
  body: StockAdjustInput
  user: SafeUser
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    const movement = await adjustStock(params.id, body, user.id)
    set.status = 201
    return movement
  })
}

// Urun stok hareket gecmisini listeler
export async function listStockHistory({
  params,
  query,
  set,
}: {
  params: { id: string }
  query: StockMovementListFilters
  set: { status?: number | string }
}) {
  return runController(set, async () => listStockMovements(params.id, query))
}
