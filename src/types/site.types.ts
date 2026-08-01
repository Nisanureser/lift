import type { CreateSiteBody, SiteListQuery, UpdateSiteBody } from '../dtos/site.dto'

export type CreateSiteInput = typeof CreateSiteBody.static
export type UpdateSiteInput = typeof UpdateSiteBody.static
export type SiteListFilters = typeof SiteListQuery.static

export type SiteDto = {
  id: string
  customerId: string
  name: string
  address: string
  city: string
  district: string
  contactName: string | null
  contactPhone: string | null
  notes: string | null
  isActive: boolean
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}
