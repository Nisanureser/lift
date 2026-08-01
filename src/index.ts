import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { join } from 'node:path'
import { sql } from 'drizzle-orm'
import { validateEnv, env } from './config/env'
import { db } from './database'
import { swaggerPlugin } from './plugins/swagger'
import { apiRoutes } from './routes'
import { AppError, toErrorResponse } from './utils/errors.util'

validateEnv()

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
  .get('/uploads/*', async ({ request, set }) => {
    const url = new URL(request.url)
    const filePath = url.pathname.replace('/uploads/', '')
    const file = Bun.file(join(env.UPLOAD_DIR, filePath))

    if (!(await file.exists())) {
      set.status = 404
      return { error: 'File not found' }
    }

    return file
  })
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
  .use(apiRoutes)
  .onError(({ code, error, set }) => {
    if (error instanceof AppError) {
      const { status, body } = toErrorResponse(error)
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
