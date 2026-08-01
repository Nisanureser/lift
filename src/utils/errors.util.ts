// API katmaninda tutarli hata yanitlari icin standart hata formati
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// AppError veya bilinmeyen hatalari HTTP yanitina cevirir
export function toErrorResponse(error: unknown): { status: number; body: Record<string, unknown> } {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: {
        error: error.message,
        ...(error.code ? { code: error.code } : {}),
      },
    }
  }

  return {
    status: 500,
    body: { error: 'Internal server error' },
  }
}
