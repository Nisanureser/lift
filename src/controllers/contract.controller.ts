import type { SafeUser } from '../types/auth.types'
import type {
  ContractListFilters,
  CreateContractInput,
  UpdateContractInput,
} from '../types/work-order.types'
import {
  createContract,
  deleteContract,
  getContractById,
  listContractsByCustomer,
  updateContract,
} from '../services/contract.service'
import { runController } from '../utils/controller.util'

// Musteri sozlesmelerini listeler
export async function list({
  params,
  query,
}: {
  params: { id: string }
  query: ContractListFilters
}) {
  return listContractsByCustomer(params.id, query)
}

// Sozlesme detayini getirir
export async function getById({
  params,
  set,
}: {
  params: { id: string; contractId: string }
  set: { status?: number | string }
}) {
  return runController(set, async () => getContractById(params.id, params.contractId))
}

// Yeni sozlesme olusturur
export async function create({
  params,
  body,
  user,
  set,
}: {
  params: { id: string }
  body: CreateContractInput
  user: SafeUser
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    const contract = await createContract(params.id, body, user.id)
    set.status = 201
    return contract
  })
}

// Sozlesmeyi gunceller
export async function update({
  params,
  body,
  set,
}: {
  params: { id: string; contractId: string }
  body: UpdateContractInput
  set: { status?: number | string }
}) {
  return runController(set, async () => updateContract(params.id, params.contractId, body))
}

// Sozlesmeyi soft delete ile siler
export async function remove({
  params,
  set,
}: {
  params: { id: string; contractId: string }
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    await deleteContract(params.id, params.contractId)
    set.status = 204
    return null
  })
}
