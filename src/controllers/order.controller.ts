import type { SafeUser } from '../types/auth.types'
import type { AddOrderPaymentInput, CreateOrderInput, OrderListFilters } from '../types/order.types'
import { addOrderPayment, createOrder, getOrderById, listOrders } from '../services/order.service'
import { runController } from '../utils/controller.util'

/** Fabrika siparislerini listeler. */
export async function list({ query }: { query: OrderListFilters }) {
  return listOrders(query)
}

/** Tek siparis detayini getirir. */
export async function getById({
  params,
  set,
}: {
  params: { id: string }
  set: { status?: number | string }
}) {
  return runController(set, async () => getOrderById(params.id))
}

/** Yeni siparis olusturur; stok dusumu ayni transaction icinde yapilir. */
export async function create({
  body,
  user,
  set,
}: {
  body: CreateOrderInput
  user: SafeUser
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    const order = await createOrder(body, user.id)
    set.status = 201
    return order
  })
}

/** Vadeli siparise kismi odeme kaydi ekler. */
export async function addPayment({
  params,
  body,
  user,
  set,
}: {
  params: { id: string }
  body: AddOrderPaymentInput
  user: SafeUser
  set: { status?: number | string }
}) {
  return runController(set, async () => addOrderPayment(params.id, body, user.id))
}
