import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { sql } from 'drizzle-orm'
import { validateEnv, env } from './config/env'
import { db } from './database'
import { authGuard } from './middlewares/auth.middleware'
import { swaggerPlugin } from './plugins/swagger'
import { apiRoutes } from './routes'
import { ensureStorageBucket, getObjectBytes } from './services/storage.service'
import { AppError, toErrorResponse } from './utils/errors.util'
import { databaseUnavailableResponse, isDatabaseConnectionError } from './utils/db-error.util'
import { sanitizeObjectKey } from './utils/file.util'

validateEnv()

try {
  await db.execute(sql`SELECT 1`)
} catch (error) {
  console.error('PostgreSQL baglantisi kurulamadi. DATABASE_URL ve docker compose kontrol et.')
  console.error(error)
  process.exit(1)
}

await ensureStorageBucket()

// Lift API ana uygulama instance'i; plugin ve route'lari birlestirir
const app = new Elysia()
  .use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
      credentials: true,
    }),
  )
  .use(swaggerPlugin)
  .decorate('db', db)
  .get(
    '/health',
    async () => {
      await db.execute(sql`SELECT 1`)
      return { status: 'ok', timestamp: new Date().toISOString() }
    },
    {
      response: t.Object({
        status: t.String(),
        timestamp: t.String(),
      }),
      detail: {
        summary: '/health',
        description: 'API ve veritabani baglantisinin calistigini dogrular.',
      },
    },
  )
  .use(
    new Elysia().use(authGuard).get('/uploads/*', async ({ request, set }) => {
      const url = new URL(request.url)
      const objectKey = sanitizeObjectKey(url.pathname.replace('/uploads/', ''))

      if (!objectKey) {
        set.status = 400
        return { error: 'Invalid file path' }
      }

      const object = await getObjectBytes(objectKey)

      if (!object) {
        set.status = 404
        return { error: 'File not found' }
      }

      set.headers['Content-Type'] = object.contentType
      return object.body
    }),
  )
  .use(apiRoutes)
  .onError(({ code, error, set }) => {
    if (error instanceof AppError) {
      const { status, body } = toErrorResponse(error)
      set.status = status
      return body
    }

    if (isDatabaseConnectionError(error)) {
      const { status, body } = databaseUnavailableResponse()
      set.status = status
      return body
    }

    if (code === 'VALIDATION') {
      set.status = 422
      return { error: 'Validation failed', details: error.message }
    }

    if (code === 'NOT_FOUND') {
      set.status = 404
      return { error: 'Resource not found' }
    }

    console.error(error)
    set.status = 500
    return { error: 'Internal server error' }
  })
  .listen(env.PORT)

console.log(`Lift API running at http://${app.server?.hostname}:${app.server?.port}`)
console.log(`Swagger docs at http://${app.server?.hostname}:${app.server?.port}/swagger`)

export type App = typeof app
