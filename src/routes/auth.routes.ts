import { Elysia, t } from 'elysia'
import * as authController from '../controllers/auth.controller'
import { ErrorResponse } from '../dtos/common.dto'
import {
  AuthCookieSchema,
  AuthResponse,
  AuthSessionResponse,
  LoginBody,
  LogoutBody,
  RefreshBody,
  RegisterBody,
  UserResponse,
} from '../dtos/auth.dto'
import { authGuard, jwtPlugin } from '../middlewares/auth.middleware'

// Auth endpoint'lerini controller'lara baglayan route grubu
export const authRoutes = new Elysia({ prefix: '/auth', tags: ['auth'] })
  .use(jwtPlugin)
  .post('/register', ({ body, jwt, set, cookie }) => authController.register({ body, jwt, set, cookie }), {
    body: RegisterBody,
    cookie: AuthCookieSchema,
    response: {
      201: AuthResponse,
      409: ErrorResponse,
      422: ErrorResponse,
    },
    detail: {
      summary: '/auth/register',
      description:
        'Kayit sonrasi accessToken ve refreshToken httpOnly cookie olarak set edilir; body sadece user doner.',
    },
  })
  .post('/login', ({ body, jwt, set, cookie }) => authController.login({ body, jwt, set, cookie }), {
    body: LoginBody,
    cookie: AuthCookieSchema,
    response: {
      200: AuthResponse,
      401: ErrorResponse,
      422: ErrorResponse,
    },
    detail: {
      summary: '/auth/login',
      description:
        'Email veya telefon ile giris. Tokenlar httpOnly cookie olarak set edilir; body sadece user doner.',
    },
  })
  .post(
    '/refresh',
    ({ body, jwt, set, cookie }) => authController.refresh({ body, jwt, set, cookie }),
    {
      body: RefreshBody,
      cookie: AuthCookieSchema,
      response: {
        200: AuthSessionResponse,
        401: ErrorResponse,
        422: ErrorResponse,
      },
      detail: {
        summary: '/auth/refresh',
        description:
          'Refresh token cookie ile yeni token cifti uretir. Mobil/API client icin body.refreshToken fallback desteklenir.',
      },
    },
  )
  .post(
    '/logout',
    ({ body, set, cookie, request, jwt }) =>
      authController.logout({ body, set, cookie, request, jwt }),
    {
      body: LogoutBody,
      cookie: AuthCookieSchema,
      response: {
        200: AuthSessionResponse,
        401: ErrorResponse,
      },
      detail: {
        summary: '/auth/logout',
        description:
          'Refresh token iptal edilir, access token blackliste alinir, cookie silinir. Access token suresi dolmus olsa bile calisir.',
      },
    },
  )
  .use(authGuard)
  .get('/me', authController.me, {
    response: {
      200: t.Object({ user: UserResponse }),
      401: ErrorResponse,
    },
    detail: {
      summary: '/auth/me',
      description: 'lift_access_token cookie veya Authorization: Bearer header ile calisir.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    },
  })
