import { Elysia, t } from 'elysia'
import * as categoryController from '../controllers/category.controller'
import {
  CategoryIdParam,
  CategoryListQuery,
  CategoryListResponse,
  CategoryResponse,
  CreateCategoryBody,
  UpdateCategoryBody,
} from '../dtos/category.dto'
import { ErrorResponse } from '../dtos/common.dto'
import { authGuard } from '../middlewares/auth.middleware'

// Korunan endpoint'ler icin Swagger security tanimi
const authSecurity = [{ bearerAuth: [] }, { cookieAuth: [] }] as Array<Record<string, string[]>>

// Kategori CRUD endpoint'leri
export const categoryRoutes = new Elysia({ prefix: '/categories', tags: ['categories'] })
  .get('/', categoryController.list, {
    query: CategoryListQuery,
    response: {
      200: CategoryListResponse,
    },
    detail: {
      summary: '/categories',
      description: 'Kategori listesini dondurur.',
    },
  })
  .get('/:id', categoryController.getById, {
    params: CategoryIdParam,
    response: {
      200: CategoryResponse,
      404: ErrorResponse,
    },
    detail: {
      summary: '/categories/:id',
      description: 'Tek kategori detayi.',
    },
  })
  .group('', (app) =>
    app
      .use(authGuard)
      .post('/', categoryController.create, {
        body: CreateCategoryBody,
        response: {
          201: CategoryResponse,
          401: ErrorResponse,
          409: ErrorResponse,
          422: ErrorResponse,
        },
        detail: {
          summary: '/categories',
          description: 'Yeni kategori olusturur. JWT gerekli.',
          security: authSecurity,
        },
      })
      .patch('/:id', categoryController.update, {
        params: CategoryIdParam,
        body: UpdateCategoryBody,
        response: {
          200: CategoryResponse,
          401: ErrorResponse,
          404: ErrorResponse,
          409: ErrorResponse,
          422: ErrorResponse,
        },
        detail: {
          summary: '/categories/:id',
          description: 'Kategoriyi gunceller. JWT gerekli.',
          security: authSecurity,
        },
      })
      .delete('/:id', categoryController.remove, {
        params: CategoryIdParam,
        response: {
          204: t.Void(),
          401: ErrorResponse,
          404: ErrorResponse,
          409: ErrorResponse,
        },
        detail: {
          summary: '/categories/:id',
          description: 'Kategoriyi siler (bagli urun varsa engellenir). JWT gerekli.',
          security: authSecurity,
        },
      }),
  )
