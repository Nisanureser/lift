// Urun olcu birimleri
export const PRODUCT_UNITS = {
  PIECE: 'piece',
  LITER: 'liter',
  KILOGRAM: 'kilogram',
  METER: 'meter',
  BOX: 'box',
  PACK: 'pack',
} as const

export type ProductUnit = (typeof PRODUCT_UNITS)[keyof typeof PRODUCT_UNITS]

export const PRODUCT_UNIT_LABELS: Record<ProductUnit, string> = {
  piece: 'Adet',
  liter: 'Litre',
  kilogram: 'Kilogram',
  meter: 'Metre',
  box: 'Kutu',
  pack: 'Paket',
}

// Stok hareket tipleri
export const STOCK_MOVEMENT_TYPES = {
  IN: 'in',
  OUT: 'out',
  ADJUSTMENT: 'adjustment',
} as const

export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[keyof typeof STOCK_MOVEMENT_TYPES]

// Urun fotografi icin izin verilen MIME tipleri
export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const

// Tek fotograf max boyutu (5MB)
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

// Urun basina max fotograf sayisi
export const MAX_IMAGES_PER_PRODUCT = 20
