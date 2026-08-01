import type { StockAdjustBody, StockInBody, StockMovementListQuery } from '../dtos/stock.dto'

export type StockInInput = typeof StockInBody.static
export type StockOutInput = typeof StockInBody.static
export type StockAdjustInput = typeof StockAdjustBody.static
export type StockMovementListFilters = typeof StockMovementListQuery.static

export type StockMovementDto = {
  id: string
  productId: string
  type: string
  quantity: string
  previousStock: string
  newStock: string
  note: string | null
  createdBy: string | null
  createdAt: Date
}
