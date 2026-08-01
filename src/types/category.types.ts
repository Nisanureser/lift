import type { CreateCategoryBody, CategoryListQuery, UpdateCategoryBody } from '../dtos/category.dto'

export type CreateCategoryInput = typeof CreateCategoryBody.static
export type UpdateCategoryInput = typeof UpdateCategoryBody.static
export type CategoryListFilters = typeof CategoryListQuery.static

export type CategoryDto = {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
