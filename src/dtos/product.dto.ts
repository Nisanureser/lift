import { t } from 'elysia'
import { PRODUCT_UNITS } from '../constants/product.constants'

// Urun olcu birimi semasi
const ProductUnitSchema = t.Union([
  t.Literal(PRODUCT_UNITS.PIECE),
  t.Literal(PRODUCT_UNITS.LITER),
  t.Literal(PRODUCT_UNITS.KILOGRAM),
  t.Literal(PRODUCT_UNITS.METER),
  t.Literal(PRODUCT_UNITS.BOX),
  t.Literal(PRODUCT_UNITS.PACK),
])

// Stok miktari string semasi (max 3 ondalik)
const StockQuantityString = t.String({ pattern: '^\\d+(\\.\\d{1,3})?$' })

// Urun olusturma body semasi
export const CreateProductBody = t.Object({
  sku: t.String({ minLength: 1, maxLength: 100 }),
  name: t.String({ minLength: 2, maxLength: 200 }),
  description: t.String({ minLength: 3 }),
  price: t.String({ pattern: '^\\d+(\\.\\d{1,2})?$' }),
  unit: ProductUnitSchema,
  categoryId: t.String({ minLength: 1 }),
  initialStock: t.Optional(StockQuantityString),
  isActive: t.Optional(t.Boolean()),
})

// Urun guncelleme body semasi (stok buradan guncellenmez)
export const UpdateProductBody = t.Partial(
  t.Object({
    sku: t.String({ minLength: 1, maxLength: 100 }),
    name: t.String({ minLength: 2, maxLength: 200 }),
    description: t.String({ minLength: 3 }),
    price: t.String({ pattern: '^\\d+(\\.\\d{1,2})?$' }),
    unit: ProductUnitSchema,
    categoryId: t.String({ minLength: 1 }),
    isActive: t.Boolean(),
  }),
)

// Urun listeleme query semasi
export const ProductListQuery = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50, default: 20 })),
  categoryId: t.Optional(t.String({ minLength: 1 })),
  search: t.Optional(t.String({ minLength: 1 })),
  isActive: t.Optional(t.Boolean()),
})

// Urun ID path param semasi
export const ProductIdParam = t.Object({
  id: t.String({ minLength: 1 }),
})

// Urun + fotograf ID path param semasi
export const ProductImageParam = t.Object({
  id: t.String({ minLength: 1 }),
  imageId: t.String({ minLength: 1 }),
})

// Urun fotografi yanit semasi
export const ProductImageResponse = t.Object({
  id: t.String(),
  url: t.String(),
  fileName: t.String(),
  mimeType: t.String(),
  isPrimary: t.Boolean(),
  sortOrder: t.Integer(),
  createdAt: t.Date(),
})

// Urun icindeki kategori ozeti
export const ProductCategorySummary = t.Object({
  id: t.String(),
  name: t.String(),
  isActive: t.Boolean(),
})

// Urun detay yanit semasi
export const ProductResponse = t.Object({
  id: t.String(),
  sku: t.String(),
  name: t.String(),
  description: t.String(),
  price: t.String(),
  unit: t.String(),
  stockQuantity: t.String(),
  categoryId: t.String(),
  category: ProductCategorySummary,
  isActive: t.Boolean(),
  createdBy: t.Nullable(t.String()),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  images: t.Array(ProductImageResponse),
})

// Liste icin kisa urun semasi
export const ProductListItemResponse = t.Object({
  id: t.String(),
  sku: t.String(),
  name: t.String(),
  description: t.String(),
  price: t.String(),
  unit: t.String(),
  stockQuantity: t.String(),
  categoryId: t.String(),
  categoryName: t.String(),
  isActive: t.Boolean(),
  primaryImage: t.Nullable(ProductImageResponse),
  createdAt: t.Date(),
})

// Sayfalanmis urun listesi yanit semasi
export const ProductListResponse = t.Object({
  data: t.Array(ProductListItemResponse),
  pagination: t.Object({
    page: t.Integer(),
    limit: t.Integer(),
    total: t.Integer(),
    pages: t.Integer(),
  }),
})

// Coklu fotograf yukleme body semasi
export const UploadProductImagesBody = t.Object({
  images: t.Files(),
})

// Coklu fotograf yukleme yanit semasi
export const UploadProductImagesResponse = t.Object({
  images: t.Array(ProductImageResponse),
  total: t.Integer(),
})
