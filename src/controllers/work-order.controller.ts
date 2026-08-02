import type { SafeUser } from '../types/auth.types'
import type {
  CompleteWorkOrderInput,
  CreateWorkOrderInput,
  UpdateWorkOrderInput,
  WorkOrderListFilters,
} from '../types/work-order.types'
import {
  createWorkOrder,
  deleteWorkOrder,
  getWorkOrderDtoById,
  listWorkOrders,
  updateWorkOrder,
  updateWorkOrderStatus,
} from '../services/work-order.service'
import { completeWorkOrder, getServiceLogByWorkOrderId } from '../services/service-log.service'
import { AppError } from '../utils/errors.util'
import { ERROR_CODES } from '../constants/error-codes'
import { runController } from '../utils/controller.util'
import type { WorkOrderStatus } from '../constants/work-order.constants'

// Is emirlerini listeler
export async function list({
  query,
  set,
}: {
  query: WorkOrderListFilters
  set: { status?: number | string }
}) {
  return runController(set, async () => listWorkOrders(query))
}

// Is emri detayini getirir
export async function getById({
  params,
  set,
}: {
  params: { id: string }
  set: { status?: number | string }
}) {
  return runController(set, async () => getWorkOrderDtoById(params.id))
}

// Yeni is emri olusturur
export async function create({
  body,
  user,
  set,
}: {
  body: CreateWorkOrderInput
  user: SafeUser
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    const workOrder = await createWorkOrder(body, user.id)
    set.status = 201
    return workOrder
  })
}

// Is emrini gunceller
export async function update({
  params,
  body,
  set,
}: {
  params: { id: string }
  body: UpdateWorkOrderInput
  set: { status?: number | string }
}) {
  return runController(set, async () => updateWorkOrder(params.id, body))
}

// Is emri durumunu gunceller
export async function updateStatus({
  params,
  body,
  set,
}: {
  params: { id: string }
  body: { status: WorkOrderStatus }
  set: { status?: number | string }
}) {
  return runController(set, async () => updateWorkOrderStatus(params.id, body.status))
}

// Is emrini tamamlar ve servis kaydi olusturur
export async function complete({
  params,
  body,
  user,
  set,
}: {
  params: { id: string }
  body: CompleteWorkOrderInput
  user: SafeUser
  set: { status?: number | string }
}) {
  return runController(set, async () => completeWorkOrder(params.id, body, user.id))
}

// Is emrine bagli servis kaydini getirir
export async function getServiceLog({
  params,
  set,
}: {
  params: { id: string }
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    const serviceLog = await getServiceLogByWorkOrderId(params.id)

    if (!serviceLog) {
      throw new AppError('Service log not found', 404, ERROR_CODES.SERVICE_LOG_NOT_FOUND)
    }

    return serviceLog
  })
}

// Is emrini soft delete ile siler
export async function remove({
  params,
  set,
}: {
  params: { id: string }
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    await deleteWorkOrder(params.id)
    set.status = 204
    return null
  })
}
