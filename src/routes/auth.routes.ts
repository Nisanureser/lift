import { Elysia, t } from 'elysia'
import * as authController from '../controllers/auth.controller'
import {
  AuthResponse,
  AuthTokensResponse,
  LoginBody,
  LogoutBody,
  RefreshBody,
  RegisterBody,
  UserResponse,
} from '../dtos/auth.dto'
import { authGuard, jwtPlugin } from '../middlewares/auth.middleware'

const tokenErrorResponse = t.Object({ error: t.String(), code: t.Optional(t.String()) })

// Auth endpoint'lerini controller'lara baglayan route grubu
export const authRoutes = new Elysia({ prefix: '/auth', tags: ['auth'] })
  .use(jwtPlugin)
  .post('/register', authController.register, {
    body: RegisterBody,
    response: {
      201: AuthResponse,
      409: tokenErrorResponse,
      422: tokenErrorResponse,
    },
    detail: {
      summary: '/auth/register',
      description: 'Kayit sonrasi accessToken (kisa omurlu) ve refreshToken (uzun omurlu) doner.',
    },
  })
  .post('/login', authController.login, {
    body: LoginBody,
    response: {
      200: AuthResponse,
      401: tokenErrorResponse,
      422: tokenErrorResponse,
    },
    detail: {
      summary: '/auth/login',
      description: 'Email veya telefon ile giris. accessToken + refreshToken doner.',
    },
  })
  .post('/refresh', authController.refresh, {
    body: RefreshBody,
    response: {
      200: AuthTokensResponse,
      401: tokenErrorResponse,
      422: tokenErrorResponse,
    },
    detail: {
      summary: '/auth/refresh',
      description: 'Suresi dolmus accessToken yerine refreshToken ile yeni token cifti alir.',
    },
  })
  .group('', (app) =>
    app
      .use(authGuard)
      .get('/me', authController.me, {
        response: {
          200: t.Object({ user: UserResponse }),
          401: tokenErrorResponse,
        },
        detail: {
          summary: '/auth/me',
          description: 'Authorization: Bearer {accessToken} header ile calisir.',
          security: [{ bearerAuth: [] }],
        },
      })
      .post(
        '/logout',
        ({ body, accessJti, set }) => authController.logout({ body, accessJti, set }),
        {
          body: LogoutBody,
          response: {
            200: t.Object({ message: t.String() }),
            401: tokenErrorResponse,
          },
          detail: {
            summary: '/auth/logout',
            description: 'Refresh token iptal edilir, access token blackliste alinir.',
            security: [{ bearerAuth: [] }],
          },
        },
      ),
  )
