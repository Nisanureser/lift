import { randomUUID } from 'crypto'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { env } from '../config/env'
import {
  ALLOWED_IMAGE_MIMES,
  MAX_IMAGE_SIZE_BYTES,
} from '../constants/product.constants'
import { ERROR_CODES } from '../constants/error-codes'
import { AppError } from './errors.util'

// Urun adindan URL-dostu slug uretir
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Yuklenen dosyanin public URL'ini olusturur
export function toPublicFileUrl(relativePath: string): string {
  const normalized = relativePath.replace(/^\/+/, '')
  return `${env.PUBLIC_BASE_URL}/uploads/${normalized}`
}

// Upload klasorunu urun bazinda hazirlar
export async function ensureProductUploadDir(productId: string): Promise<string> {
  const dir = join(env.UPLOAD_DIR, 'products', productId)
  await mkdir(dir, { recursive: true })
  return dir
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
