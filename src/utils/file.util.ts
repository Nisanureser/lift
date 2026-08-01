import { randomUUID } from 'crypto'
import { env } from '../config/env'
import {
  ALLOWED_IMAGE_MIMES,
  MAX_IMAGE_SIZE_BYTES,
} from '../constants/product.constants'
import { ERROR_CODES } from '../constants/error-codes'
import { AppError } from './errors.util'

// S3 object key icin urun fotograf yolunu olusturur
export function buildProductObjectKey(productId: string, fileName: string): string {
  return `products/${productId}/${fileName}`
}

// Proxy uzerinden erisilecek public URL'i olusturur
export function toPublicFileUrl(objectKey: string): string {
  const normalized = objectKey.replace(/^\/+/, '')
  return `${env.PUBLIC_BASE_URL}/uploads/${normalized}`
}

// Yuklenen fotograf dosyasini dogrular
export function validateImageFile(file: File): void {
  if (!ALLOWED_IMAGE_MIMES.includes(file.type as (typeof ALLOWED_IMAGE_MIMES)[number])) {
    throw new AppError('Invalid file type. Allowed: jpeg, png, webp', 422, ERROR_CODES.INVALID_FILE_TYPE)
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new AppError('File too large. Max 5MB', 422, ERROR_CODES.FILE_TOO_LARGE)
  }
}

// Benzersiz dosya adi uretir
export function buildImageFileName(originalName: string): string {
  const extension = originalName.split('.').pop()?.toLowerCase() ?? 'jpg'
  return `${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`
}

// Upload proxy path traversal saldirilarini engeller
export function sanitizeObjectKey(rawPath: string): string | null {
  const normalized = rawPath.replace(/^\/+/, '').replace(/\\/g, '/')

  if (!normalized || normalized.includes('..') || normalized.startsWith('/')) {
    return null
  }

  return normalized
}
