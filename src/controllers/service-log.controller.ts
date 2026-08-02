import type { SafeUser } from '../types/auth.types'
import type {
  AddServicePartInput,
  CompleteWorkOrderInput,
  CreateServiceLogInput,
  ServiceLogListFilters,
  UpdateServiceLogInput,
} from '../types/work-order.types'
import { getElevatorForSiteOrThrow } from '../services/elevator.service'
import {
  addServicePart,
  createServiceLog,
  deleteServiceLog,
  getServiceLogById,
  listServiceLogsByElevator,
  listServiceParts,
  updateServiceLog,
  uploadServiceLogPhoto,
} from '../services/service-log.service'
import { runController } from '../utils/controller.util'

// Ad-hoc servis kaydi olusturur
export async function create({
  body,
  user,
  set,
}: {
  body: CreateServiceLogInput
  user: SafeUser
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    const serviceLog = await createServiceLog(body, user.id)
    set.status = 201
    return serviceLog
  })
}

// Servis kaydi detayini getirir
export async function getById({
  params,
  set,
}: {
  params: { id: string }
  set: { status?: number | string }
}) {
  return runController(set, async () => getServiceLogById(params.id))
}

// Servis kaydini gunceller
export async function update({
  params,
  body,
  set,
}: {
  params: { id: string }
  body: UpdateServiceLogInput
  set: { status?: number | string }
}) {
  return runController(set, async () => updateServiceLog(params.id, body))
}

// Servis kaydini soft delete ile siler
export async function remove({
  params,
  set,
}: {
  params: { id: string }
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    await deleteServiceLog(params.id)
    set.status = 204
    return null
  })
}

// Asansor servis gecmisini listeler
export async function listHistory({
  params,
  query,
  set,
}: {
  params: { id: string; siteId: string; elevatorId: string }
  query: ServiceLogListFilters
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    await getElevatorForSiteOrThrow(params.id, params.siteId, params.elevatorId)
    return listServiceLogsByElevator(params.elevatorId, query)
  })
}

// Servis kaydina fotograf yukler
export async function uploadPhoto({
  params,
  body,
  user,
  set,
}: {
  params: { id: string }
  body: { file: File }
  user: SafeUser
  set: { status?: number | string }
}) {
  return runController(set, async () => uploadServiceLogPhoto(params.id, body.file, user.id))
}

// Servis kaydina parca ekler
export async function addPart({
  params,
  body,
  user,
  set,
}: {
  params: { id: string }
  body: AddServicePartInput
  user: SafeUser
  set: { status?: number | string }
}) {
  return runController(set, async () => addServicePart(params.id, body, user.id))
}

// Servis kaydinin parcalarini listeler
export async function listParts({
  params,
  set,
}: {
  params: { id: string }
  set: { status?: number | string }
}) {
  return runController(set, async () => ({
    data: await listServiceParts(params.id),
  }))
}
