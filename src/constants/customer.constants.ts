// Musteri tipi sabitleri
export const CUSTOMER_TYPES = {
  INDIVIDUAL: 'individual',
  CORPORATE: 'corporate',
} as const

export type CustomerType = (typeof CUSTOMER_TYPES)[keyof typeof CUSTOMER_TYPES]
