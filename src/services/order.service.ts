import { and, count, desc, eq, inArray } from 'drizzle-orm'
import { ERROR_CODES } from '../constants/error-codes'
import {
  ORDER_MOVEMENT_TYPES,
  ORDER_PAYMENT_METHODS,
  ORDER_STATUSES,
  type OrderMovementType,
  type OrderPaymentMethod,
  type OrderStatus,
} from '../constants/order.constants'
import { db } from '../database'
import {
  orderItems,
  orderMovements,
  orderPayments,
  orders,
  products,
  users,
} from '../database/schema'
import type {
  AddOrderPaymentInput,
  CreateOrderInput,
  OrderDto,
  OrderListFilters,
  OrderListItemDto,
} from '../types/order.types'
import { parseStockQuantity, stockOutInTransaction } from './stock.service'
import { AppError } from '../utils/errors.util'
import { notDeleted } from '../utils/soft-delete.util'

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** Odeme yontemi gecerliligini kontrol eder. */
function ensureValidPaymentMethod(value: string): asserts value is OrderPaymentMethod {
  const valid = Object.values(ORDER_PAYMENT_METHODS) as string[]
  if (!valid.includes(value)) {
    throw new AppError('Invalid order payment method', 422, ERROR_CODES.INVALID_ORDER_PAYMENT_METHOD)
  }
}

/** Fiyat stringini dogrular. */
function parsePrice(value: string): number {
  const num = Number(value)
  if (!Number.isFinite(num) || num < 0) {
    throw new AppError('Invalid payment amount', 422, ERROR_CODES.INVALID_ORDER_PAYMENT_AMOUNT)
  }
  return num
}

/** Para tutarini DB formatina cevirir. */
function toMoneyString(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

/** Siparis kaydini bulur; yoksa 404 doner. */
async function getOrderOrThrow(orderId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), notDeleted(orders.deletedAt)))
    .limit(1)

  if (!order) {
    throw new AppError('Order not found', 404, ERROR_CODES.ORDER_NOT_FOUND)
  }

  return order
}

/** Siparis detayini iliskili kayitlarla birlikte yukler. */
async function loadOrderDto(orderId: string): Promise<OrderDto> {
  const order = await getOrderOrThrow(orderId)

  const [items, movements, payments, creator] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, orderId)),
    db
      .select()
      .from(orderMovements)
      .where(eq(orderMovements.orderId, orderId))
      .orderBy(desc(orderMovements.createdAt)),
    db
      .select()
      .from(orderPayments)
      .where(eq(orderPayments.orderId, orderId))
      .orderBy(desc(orderPayments.createdAt)),
    order.createdBy
      ? db.select({ username: users.username }).from(users).where(eq(users.id, order.createdBy)).limit(1)
      : Promise.resolve([]),
  ])

  const paymentCreatorIds = payments
    .map((payment) => payment.createdBy)
    .filter((id): id is string => Boolean(id))

  const paymentCreators =
    paymentCreatorIds.length > 0
      ? await db
          .select({ id: users.id, username: users.username })
          .from(users)
          .where(inArray(users.id, paymentCreatorIds))
      : []

  const creatorMap = new Map(paymentCreators.map((row) => [row.id, row.username]))

  return {
    id: order.id,
    paymentMethodId: order.paymentMethodId as OrderPaymentMethod,
    status: order.status as OrderStatus,
    total: String(order.total),
    customerNote: order.customerNote,
    createdBy: order.createdBy,
    createdByName: creator[0]?.username ?? null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      unitPrice: String(item.unitPrice),
      quantity: String(item.quantity),
      lineTotal: String(item.lineTotal),
    })),
    movements: movements.map((movement) => ({
      id: movement.id,
      type: movement.type as OrderMovementType,
      label: movement.label,
      description: movement.description,
      createdAt: movement.createdAt,
    })),
    payments: payments.map((payment) => ({
      id: payment.id,
      amount: String(payment.amount),
      note: payment.note,
      createdBy: payment.createdBy,
      createdByName: payment.createdBy ? (creatorMap.get(payment.createdBy) ?? null) : null,
      createdAt: payment.createdAt,
    })),
  }
}

/** Siparis hareket kaydi olusturur. */
async function insertMovement(
  tx: DbTransaction,
  orderId: string,
  type: OrderMovementType,
  label: string,
  description: string,
) {
  await tx.insert(orderMovements).values({
    orderId,
    type,
    label,
    description,
  })
}

/** Yeni siparis olusturur, stok dusumu ve hareket kayitlarini yazar. */
export async function createOrder(
  input: CreateOrderInput,
  userId: string,
): Promise<OrderDto> {
  ensureValidPaymentMethod(input.paymentMethodId)

  const normalizedItems = input.items.map((item) => ({
    productId: item.productId,
    quantity: parseStockQuantity(item.quantity),
  }))

  const orderId = await db.transaction(async (tx) => {
    const lineRows: {
      productId: string
      productName: string
      unitPrice: number
      quantity: number
      lineTotal: number
    }[] = []

    for (const item of normalizedItems) {
      const [product] = await tx
        .select()
        .from(products)
        .where(and(eq(products.id, item.productId), notDeleted(products.deletedAt)))
        .limit(1)

      if (!product) {
        throw new AppError('Product not found', 404, ERROR_CODES.PRODUCT_NOT_FOUND)
      }

      const unitPrice = Number(product.price)
      lineRows.push({
        productId: product.id,
        productName: product.name,
        unitPrice,
        quantity: item.quantity,
        lineTotal: unitPrice * item.quantity,
      })
    }

    const total = lineRows.reduce((sum, row) => sum + row.lineTotal, 0)

    const [order] = await tx
      .insert(orders)
      .values({
        paymentMethodId: input.paymentMethodId,
        status: ORDER_STATUSES.COMPLETED,
        total: toMoneyString(total),
        customerNote: input.customerNote?.trim() || null,
        createdBy: userId,
      })
      .returning()

    if (!order) {
      throw new AppError('Failed to create order', 500, ERROR_CODES.ORDER_CREATE_FAILED)
    }

    await tx.insert(orderItems).values(
      lineRows.map((row) => ({
        orderId: order.id,
        productId: row.productId,
        productName: row.productName,
        unitPrice: toMoneyString(row.unitPrice),
        quantity: String(row.quantity),
        lineTotal: toMoneyString(row.lineTotal),
      })),
    )

    for (const row of lineRows) {
      await stockOutInTransaction(tx, row.productId, row.quantity, userId, 'Siparis kaydi')
    }

    await insertMovement(
      tx,
      order.id,
      ORDER_MOVEMENT_TYPES.ORDER_RECEIVED,
      'Sipariş alındı',
      input.paymentMethodId === ORDER_PAYMENT_METHODS.VADELI
        ? 'Vadeli açık hesap · Ödeme takibi başlatıldı'
        : 'Fabrika siparişi sisteme kaydedildi',
    )

    await insertMovement(
      tx,
      order.id,
      ORDER_MOVEMENT_TYPES.STOCK_OUT,
      'Stok hareketi',
      `${lineRows.length} kalem depodan düşüldü`,
    )

    return order.id
  })

  return loadOrderDto(orderId)
}

/** Siparisleri sayfali listeler. */
export async function listOrders(filters: OrderListFilters): Promise<{
  data: OrderListItemDto[]
  pagination: { page: number; limit: number; total: number; pages: number }
}> {
  const page = Number(filters.page ?? 1)
  const limit = Number(filters.limit ?? 20)
  const offset = (page - 1) * limit

  const conditions = [notDeleted(orders.deletedAt)]
  if (filters.paymentMethodId) {
    conditions.push(eq(orders.paymentMethodId, filters.paymentMethodId))
  }
  if (filters.status) {
    conditions.push(eq(orders.status, filters.status))
  }

  const whereClause = and(...conditions)

  const [rows, countResult] = await Promise.all([
    db
      .select({
        order: orders,
        createdByName: users.username,
      })
      .from(orders)
      .leftJoin(users, eq(orders.createdBy, users.id))
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(orders).where(whereClause),
  ])

  const orderIds = rows.map((row) => row.order.id)

  const [itemRows, paymentTotals] = await Promise.all([
    orderIds.length > 0
      ? db
          .select({
            orderId: orderItems.orderId,
            quantity: orderItems.quantity,
          })
          .from(orderItems)
          .where(inArray(orderItems.orderId, orderIds))
      : Promise.resolve([]),
    orderIds.length > 0
      ? db
          .select({
            orderId: orderPayments.orderId,
            total: orderPayments.amount,
          })
          .from(orderPayments)
          .where(inArray(orderPayments.orderId, orderIds))
      : Promise.resolve([]),
  ])

  const itemCountMap = new Map<string, number>()
  for (const row of itemRows) {
    itemCountMap.set(row.orderId, (itemCountMap.get(row.orderId) ?? 0) + Number(row.quantity))
  }
  const paidMap = new Map<string, number>()
  for (const row of paymentTotals) {
    paidMap.set(row.orderId, (paidMap.get(row.orderId) ?? 0) + Number(row.total))
  }

  const totalCount = Number(countResult[0]?.total ?? 0)

  return {
    data: rows.map(({ order, createdByName }) => ({
      id: order.id,
      paymentMethodId: order.paymentMethodId as OrderPaymentMethod,
      status: order.status as OrderStatus,
      total: String(order.total),
      customerNote: order.customerNote,
      createdByName: createdByName ?? null,
      itemCount: itemCountMap.get(order.id) ?? 0,
      paidTotal: toMoneyString(paidMap.get(order.id) ?? 0),
      createdAt: order.createdAt,
    })),
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit) || 1,
    },
  }
}

/** Tek siparis detayini dondurur. */
export async function getOrderById(orderId: string): Promise<OrderDto> {
  return loadOrderDto(orderId)
}

/** Vadeli siparise kismi odeme kaydi ekler. */
export async function addOrderPayment(
  orderId: string,
  input: AddOrderPaymentInput,
  userId: string,
): Promise<OrderDto> {
  const order = await getOrderOrThrow(orderId)

  if (order.paymentMethodId !== ORDER_PAYMENT_METHODS.VADELI) {
    throw new AppError('Order does not accept partial payments', 422, ERROR_CODES.ORDER_PAYMENT_NOT_ALLOWED)
  }

  const amount = parsePrice(input.amount)
  if (amount <= 0) {
    throw new AppError('Invalid payment amount', 422, ERROR_CODES.INVALID_ORDER_PAYMENT_AMOUNT)
  }

  const existingPayments = await db
    .select({ amount: orderPayments.amount })
    .from(orderPayments)
    .where(eq(orderPayments.orderId, orderId))

  const paidTotal = existingPayments.reduce((sum, row) => sum + Number(row.amount), 0)
  const remaining = Number(order.total) - paidTotal

  if (amount > remaining) {
    throw new AppError('Payment exceeds remaining balance', 422, ERROR_CODES.ORDER_PAYMENT_EXCEEDS_REMAINING)
  }

  const note = input.note?.trim() || null
  const description = note ? `${toMoneyString(amount)} TL · ${note}` : `${toMoneyString(amount)} TL`

  await db.transaction(async (tx) => {
    await tx.insert(orderPayments).values({
      orderId,
      amount: toMoneyString(amount),
      note,
      createdBy: userId,
    })

    await insertMovement(
      tx,
      orderId,
      ORDER_MOVEMENT_TYPES.PAYMENT_RECEIVED,
      'Ödeme alındı',
      description,
    )

    await tx.update(orders).set({ updatedAt: new Date() }).where(eq(orders.id, orderId))
  })

  return loadOrderDto(orderId)
}
