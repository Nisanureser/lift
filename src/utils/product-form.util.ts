// Form'dan gelen tek veya coklu fotografi diziye cevirir
export function normalizeImageFiles(images?: File | File[]): File[] {
  if (!images) {
    return []
  }

  return Array.isArray(images) ? images.filter(Boolean) : [images]
}

// Silinecek fotograf ID listesini diziye cevirir
export function normalizeRemoveImageIds(value?: string | string[]): string[] {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return [...new Set(value.map((id) => id.trim()).filter(Boolean))]
  }

  const trimmed = value.trim()

  if (trimmed.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(trimmed)

      if (Array.isArray(parsed)) {
        return [
          ...new Set(
            parsed
              .filter((id): id is string => typeof id === 'string')
              .map((id) => id.trim())
              .filter(Boolean),
          ),
        ]
      }
    } catch {
      // JSON degilse tek id olarak devam et
    }
  }

  return trimmed ? [trimmed] : []
}
