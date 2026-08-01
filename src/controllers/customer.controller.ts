import type { SafeUser } from '../types/auth.types'
import type {
  CreateCustomerInput,
  CustomerListFilters,
  UpdateCustomerInput,
} from '../types/customer.types'
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  listCustomers,
  updateCustomer,
} from '../services/customer.service'
import { runController } from '../utils/controller.util'

// Musteri listesini dondurur
export async function list({ query }: { query: CustomerListFilters }) {
  return listCustomers(query)
}

// Tek musteri detayini getirir
export async function getById({
  params,
  set,
}: {
  params: { id: string }
  set: { status?: number | string }
}) {
  return runController(set, async () => getCustomerById(params.id))
}

// Yeni musteri olusturur
export async function create({
  body,
  user,
  set,
}: {
  body: CreateCustomerInput
  user: SafeUser
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    const customer = await createCustomer(body, user.id)
    set.status = 201
    return customer
  })
}

// Mevcut musteriyi gunceller
export async function update({
  params,
  body,
  set,
}: {
  params: { id: string }
  body: UpdateCustomerInput
  set: { status?: number | string }
}) {
  return runController(set, async () => updateCustomer(params.id, body))
}

// Musteriyi siler
export async function remove({
  params,
  set,
}: {
  params: { id: string }
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    await deleteCustomer(params.id)
    set.status = 204
    return null
  })
}
