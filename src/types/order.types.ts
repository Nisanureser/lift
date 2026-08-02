import type {
  OrderMovementType,
  OrderPaymentMethod,
  OrderStatus,
} from '../constants/order.constants'

export type CreateOrderItemInput = {
  productId: string
  quantity: string
}

export type CreateOrderInput = {
  items: CreateOrderItemInput[]
  paymentMethodId: OrderPaymentMethod
  customerNote?: string
}

export type AddOrderPaymentInput = {
  amount: string
  note?: string
}

export type OrderListFilters = {
  page?: number
  limit?: number
  paymentMethodId?: OrderPaymentMethod
  status?: OrderStatus
}

export type OrderItemDto = {
  id: string
  productId: string
  productName: string
  unitPrice: string
  quantity: string
  lineTotal: string
}

export type OrderMovementDto = {
  id: string
  type: OrderMovementType
  label: string
  description: string
  createdAt: Date
}

export type OrderPaymentDto = {
  id: string
  amount: string
  note: string | null
  createdBy: string | null
  createdByName: string | null
  createdAt: Date
}

export type OrderDto = {
  id: string
  paymentMethodId: OrderPaymentMethod
  status: OrderStatus
  total: string
  customerNote: string | null
  createdBy: string | null
  createdByName: string | null
  createdAt: Date
  updatedAt: Date
  items: OrderItemDto[]
  movements: OrderMovementDto[]
  payments: OrderPaymentDto[]
}

export type OrderListItemDto = {
  id: string
  paymentMethodId: OrderPaymentMethod
  status: OrderStatus
  total: string
  customerNote: string | null
  createdByName: string | null
  itemCount: number
  paidTotal: string
  createdAt: Date
}
