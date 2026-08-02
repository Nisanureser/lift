/** Fabrika malzeme siparisi odeme yontemleri. */
export const ORDER_PAYMENT_METHODS = {
  NAKIT: 'nakit',
  HAVALE: 'havale',
  KREDI_KARTI_POS: 'kredi_karti_pos',
  VADELI: 'vadeli',
  DIGER: 'diger',
} as const

export type OrderPaymentMethod =
  (typeof ORDER_PAYMENT_METHODS)[keyof typeof ORDER_PAYMENT_METHODS]

/** Siparis durum sabitleri. */
export const ORDER_STATUSES = {
  COMPLETED: 'tamamlandi',
  CANCELLED: 'iptal',
} as const

export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES]

/** Siparis hareket tipleri. */
export const ORDER_MOVEMENT_TYPES = {
  ORDER_RECEIVED: 'order_received',
  STOCK_OUT: 'stock_out',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  PAYMENT_RECEIVED: 'payment_received',
} as const

export type OrderMovementType =
  (typeof ORDER_MOVEMENT_TYPES)[keyof typeof ORDER_MOVEMENT_TYPES]
