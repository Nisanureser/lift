import { t } from 'elysia'

// Standart hata yanit semasi
export const ErrorResponse = t.Object({
  error: t.String(),
  code: t.Optional(t.String()),
})

// Basit mesaj yanit semasi
export const MessageResponse = t.Object({
  message: t.String(),
})
