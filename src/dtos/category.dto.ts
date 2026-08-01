import { t } from 'elysia'

// Kategori olusturma body semasi
export const CreateCategoryBody = t.Object({
  name: t.String({ minLength: 2, maxLength: 150 }),
  description: t.String({ minLength: 3 }),
  isActive: t.Optional(t.Boolean()),
})

// Kategori guncelleme body semasi
export const UpdateCategoryBody = t.Partial(CreateCategoryBody)

// Kategori listeleme query semasi
export const CategoryListQuery = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
  search: t.Optional(t.String({ minLength: 1 })),
  isActive: t.Optional(t.Boolean()),
})

// Kategori ID path param semasi
export const CategoryIdParam = t.Object({
  id: t.String({ minLength: 1 }),
})

// Kategori yanit semasi
export const CategoryResponse = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.String(),
  isActive: t.Boolean(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
})

// Sayfalanmis kategori listesi yanit semasi
export const CategoryListResponse = t.Object({
  data: t.Array(CategoryResponse),
  pagination: t.Object({
    page: t.Integer(),
    limit: t.Integer(),
    total: t.Integer(),
    pages: t.Integer(),
  }),
})
