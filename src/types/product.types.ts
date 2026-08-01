import type { CreateProductBody, ProductListQuery, UpdateProductBody } from '../dtos/product.dto'

export type CreateProductInput = typeof CreateProductBody.static
export type UpdateProductInput = typeof UpdateProductBody.static
export type ProductListFilters = typeof ProductListQuery.static

export type ProductImageDto = {
  id: string
  url: string
  fileName: string
  mimeType: string
  isPrimary: boolean
  sortOrder: number
  createdAt: Date
}

export type ProductCategorySummaryDto = {
  id: string
  name: string
  isActive: boolean
}

export type ProductDto = {
  id: string
  sku: string
  name: string
  description: string
  price: string
  unit: string
  stockQuantity: string
  categoryId: string
  category: ProductCategorySummaryDto
  isActive: boolean
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
  images: ProductImageDto[]
}

export type ProductListItemDto = {
  id: string
  sku: string
  name: string
  description: string
  price: string
  unit: string
  stockQuantity: string
  categoryId: string
  categoryName: string
  isActive: boolean
  primaryImage: ProductImageDto | null
  createdAt: Date
}
