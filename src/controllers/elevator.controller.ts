import type { SafeUser } from '../types/auth.types'
import type {
  CreateElevatorInput,
  ElevatorListFilters,
  UpdateElevatorInput,
} from '../types/elevator.types'
import {
  createElevator,
  deleteElevator,
  getElevatorById,
  listElevatorsBySite,
  updateElevator,
} from '../services/elevator.service'
import { runController } from '../utils/controller.util'

// Tesisin asansor listesini dondurur
export async function list({
  params,
  query,
}: {
  params: { id: string; siteId: string }
  query: ElevatorListFilters
}) {
  return listElevatorsBySite(params.id, params.siteId, query)
}

// Tek asansor detayini getirir
export async function getById({
  params,
  set,
}: {
  params: { id: string; siteId: string; elevatorId: string }
  set: { status?: number | string }
}) {
  return runController(set, async () =>
    getElevatorById(params.id, params.siteId, params.elevatorId),
  )
}

// Tesise yeni asansor ekler
export async function create({
  params,
  body,
  user,
  set,
}: {
  params: { id: string; siteId: string }
  body: CreateElevatorInput
  user: SafeUser
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    const elevator = await createElevator(params.id, params.siteId, body, user.id)
    set.status = 201
    return elevator
  })
}

// Asansoru gunceller
export async function update({
  params,
  body,
  set,
}: {
  params: { id: string; siteId: string; elevatorId: string }
  body: UpdateElevatorInput
  set: { status?: number | string }
}) {
  return runController(set, async () =>
    updateElevator(params.id, params.siteId, params.elevatorId, body),
  )
}

// Asansoru soft delete ile siler
export async function remove({
  params,
  set,
}: {
  params: { id: string; siteId: string; elevatorId: string }
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    await deleteElevator(params.id, params.siteId, params.elevatorId)
    set.status = 204
    return null
  })
}
