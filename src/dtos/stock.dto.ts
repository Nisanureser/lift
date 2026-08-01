import { t } from 'elysia'

// Stok miktari string semasi (max 3 ondalik)
export const StockQuantityString = t.String({ pattern: '^\\d+(\\.\\d{1,3})?$' })

// Stok girisi body semasi
export const StockInBody = t.Object({
  quantity: StockQuantityString,
  note: t.Optional(t.String({ maxLength: 500 })),
})

// Stok cikisi body semasi
export const StockOutBody = StockInBody

// Stok duzeltme body semasi (yeni toplam miktar)
export const StockAdjustBody = t.Object({
  quantity: StockQuantityString,
  note: t.Optional(t.String({ maxLength: 500 })),
})

// Stok hareket listesi query semasi
export const StockMovementListQuery = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50, default: 20 })),
})

// Stok hareket yanit semasi
export const StockMovementResponse = t.Object({
  id: t.String(),
  productId: t.String(),
  type: t.String(),
  quantity: t.String(),
  previousStock: t.String(),
  newStock: t.String(),
  note: t.Nullable(t.String()),
  createdBy: t.Nullable(t.String()),
  createdAt: t.Date(),
})

// Sayfalanmis stok hareket listesi yanit semasi
export const StockMovementListResponse = t.Object({
  data: t.Array(StockMovementResponse),
  pagination: t.Object({
    page: t.Integer(),
    limit: t.Integer(),
    total: t.Integer(),
    pages: t.Integer(),
  }),
})
