import type { SafeUser } from '../types/auth.types'
import type { CreateProductInput, ProductListFilters, UpdateProductInput } from '../types/product.types'
import type { StockAdjustInput, StockInInput, StockMovementListFilters } from '../types/stock.types'
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
} from '../services/product.service'
import { adjustStock, listStockMovements, stockIn, stockOut } from '../services/stock.service'
import { runController } from '../utils/controller.util'
import { normalizeImageFiles, normalizeRemoveImageIds } from '../utils/product-form.util'

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

// Yeni asansor urunu olusturur; body'deki images varsa ayni istekte yukler
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
    const { images, ...productInput } = body
    const product = await createProduct(productInput, user.id, normalizeImageFiles(images))

    set.status = 201
    return product
  })
}

// Mevcut urunu gunceller; removeImageIds ile silme, images ile ekleme yapilir
export async function update({
  params,
  body,
  set,
}: {
  params: { id: string }
  body: UpdateProductInput
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    const { images, removeImageIds, ...productInput } = body

    return updateProduct(
      params.id,
      productInput,
      normalizeImageFiles(images),
      normalizeRemoveImageIds(removeImageIds),
    )
  })
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
