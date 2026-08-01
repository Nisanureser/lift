// Uygulama baslangicinda gerekli ortam degiskenlerini dogrular ve tip-guvenli erisim saglar
export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 3000),
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  JWT_SECRET: process.env.JWT_SECRET ?? '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
} as const

// Eksik kritik env degiskenlerini erken tespit eder
export function validateEnv(): void {
  const required = ['DATABASE_URL', 'JWT_SECRET'] as const

  for (const key of required) {
    if (!env[key]) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
  }

  if (env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters')
  }
}
