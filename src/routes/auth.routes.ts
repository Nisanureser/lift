import { Elysia, t } from 'elysia'
import * as authController from '../controllers/auth.controller'
import { LoginBody, RegisterBody, UserResponse } from '../dtos/auth.dto'
import { authGuard, jwtPlugin } from '../middlewares/auth.middleware'

// Auth endpoint'lerini controller'lara baglayan route grubu
export const authRoutes = new Elysia({ prefix: '/auth', tags: ['auth'] })
  .use(jwtPlugin)
  .post('/register', authController.register, {
    body: RegisterBody,
    response: {
      201: t.Object({
        user: UserResponse,
        token: t.String(),
      }),
      409: t.Object({ error: t.String(), code: t.Optional(t.String()) }),
      422: t.Object({ error: t.String() }),
    },
    detail: {
      summary: '/auth/register',
      description: 'Email ve kullanici adi benzersiz olmalidir. Basarili kayitta JWT token doner.',
    },
  })
  .post('/login', authController.login, {
    body: LoginBody,
    response: {
      200: t.Object({
        user: UserResponse,
        token: t.String(),
      }),
      401: t.Object({ error: t.String(), code: t.Optional(t.String()) }),
      422: t.Object({ error: t.String() }),
    },
    detail: {
      summary: '/auth/login',
      description: 'Email veya telefon ve sifre ile giris yapar, JWT access token doner.',
    },
  })
  .group('', (app) =>
    app.use(authGuard).get('/me', authController.me, {
      response: {
        200: t.Object({ user: UserResponse }),
        401: t.Object({ error: t.String(), code: t.Optional(t.String()) }),
      },
      detail: {
        summary: '/auth/me',
        description: 'Authorization: Bearer {token} header ile calisir.',
        security: [{ bearerAuth: [] }],
      },
    }),
  )
