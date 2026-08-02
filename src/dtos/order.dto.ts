import { t } from 'elysia'
import { ORDER_PAYMENT_METHODS, ORDER_STATUSES } from '../constants/order.constants'

const OrderPaymentMethodSchema = t.Union([
  t.Literal(ORDER_PAYMENT_METHODS.NAKIT),
  t.Literal(ORDER_PAYMENT_METHODS.HAVALE),
  t.Literal(ORDER_PAYMENT_METHODS.KREDI_KARTI_POS),
  t.Literal(ORDER_PAYMENT_METHODS.VADELI),
  t.Literal(ORDER_PAYMENT_METHODS.DIGER),
])

const OrderStatusSchema = t.Union([
  t.Literal(ORDER_STATUSES.COMPLETED),
  t.Literal(ORDER_STATUSES.CANCELLED),
])

const StockQuantityString = t.String({ pattern: '^\\d+(\\.\\d{1,3})?$' })
const PriceString = t.String({ pattern: '^\\d+(\\.\\d{1,2})?$' })

export const CreateOrderItemBody = t.Object({
  productId: t.String({ minLength: 1 }),
  quantity: StockQuantityString,
})

export const CreateOrderBody = t.Object({
  items: t.Array(CreateOrderItemBody, { minItems: 1 }),
  paymentMethodId: OrderPaymentMethodSchema,
  customerNote: t.Optional(t.String({ maxLength: 2000 })),
})

export const AddOrderPaymentBody = t.Object({
  amount: PriceString,
  note: t.Optional(t.String({ maxLength: 500 })),
})

export const OrderListQuery = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50, default: 20 })),
  paymentMethodId: t.Optional(OrderPaymentMethodSchema),
  status: t.Optional(OrderStatusSchema),
})

export const OrderIdParam = t.Object({
  id: t.String({ minLength: 1 }),
})

export const OrderItemResponse = t.Object({
  id: t.String(),
  productId: t.String(),
  productName: t.String(),
  unitPrice: t.String(),
  quantity: t.String(),
  lineTotal: t.String(),
})

export const OrderMovementResponse = t.Object({
  id: t.String(),
  type: t.String(),
  label: t.String(),
  description: t.String(),
  createdAt: t.Date(),
})

export const OrderPaymentResponse = t.Object({
  id: t.String(),
  amount: t.String(),
  note: t.Nullable(t.String()),
  createdBy: t.Nullable(t.String()),
  createdByName: t.Nullable(t.String()),
  createdAt: t.Date(),
})

export const OrderResponse = t.Object({
  id: t.String(),
  paymentMethodId: t.String(),
  status: t.String(),
  total: t.String(),
  customerNote: t.Nullable(t.String()),
  createdBy: t.Nullable(t.String()),
  createdByName: t.Nullable(t.String()),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  items: t.Array(OrderItemResponse),
  movements: t.Array(OrderMovementResponse),
  payments: t.Array(OrderPaymentResponse),
})

export const OrderListItemResponse = t.Object({
  id: t.String(),
  paymentMethodId: t.String(),
  status: t.String(),
  total: t.String(),
  customerNote: t.Nullable(t.String()),
  createdByName: t.Nullable(t.String()),
  itemCount: t.Integer(),
  paidTotal: t.String(),
  createdAt: t.Date(),
})

export const OrderListResponse = t.Object({
  data: t.Array(OrderListItemResponse),
  pagination: t.Object({
    page: t.Integer(),
    limit: t.Integer(),
    total: t.Integer(),
    pages: t.Integer(),
  }),
})
