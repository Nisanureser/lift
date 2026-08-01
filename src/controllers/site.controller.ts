import type { SafeUser } from '../types/auth.types'
import type { CreateSiteInput, SiteListFilters, UpdateSiteInput } from '../types/site.types'
import {
  createSite,
  deleteSite,
  getSiteById,
  listSitesByCustomer,
  updateSite,
} from '../services/site.service'
import { runController } from '../utils/controller.util'

// Musterinin tesis listesini dondurur
export async function list({
  params,
  query,
}: {
  params: { id: string }
  query: SiteListFilters
}) {
  return listSitesByCustomer(params.id, query)
}

// Tek tesis detayini getirir
export async function getById({
  params,
  set,
}: {
  params: { id: string; siteId: string }
  set: { status?: number | string }
}) {
  return runController(set, async () => getSiteById(params.id, params.siteId))
}

// Musteriye yeni tesis ekler
export async function create({
  params,
  body,
  user,
  set,
}: {
  params: { id: string }
  body: CreateSiteInput
  user: SafeUser
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    const site = await createSite(params.id, body, user.id)
    set.status = 201
    return site
  })
}

// Tesisi gunceller
export async function update({
  params,
  body,
  set,
}: {
  params: { id: string; siteId: string }
  body: UpdateSiteInput
  set: { status?: number | string }
}) {
  return runController(set, async () => updateSite(params.id, params.siteId, body))
}

// Tesisi siler
export async function remove({
  params,
  set,
}: {
  params: { id: string; siteId: string }
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    await deleteSite(params.id, params.siteId)
    set.status = 204
    return null
  })
}
