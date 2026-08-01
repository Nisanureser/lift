import { Elysia } from 'elysia'
import * as categoryController from '../controllers/category.controller'
import {
  CategoryIdParam,
  CategoryListQuery,
  CreateCategoryBody,
  UpdateCategoryBody,
} from '../dtos/category.dto'
import { authGuard } from '../middlewares/auth.middleware'

// Kategori CRUD endpoint'leri
export const categoryRoutes = new Elysia({ prefix: '/categories', tags: ['categories'] })
  .get('/', categoryController.list, {
    query: CategoryListQuery,
    detail: {
      summary: '/categories',
      description: 'Kategori listesini dondurur.',
    },
  })
  .get('/:id', categoryController.getById, {
    params: CategoryIdParam,
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
        detail: {
          summary: '/categories',
          description: 'Yeni kategori olusturur. JWT gerekli.',
          security: [{ bearerAuth: [] }],
        },
      })
      .patch('/:id', categoryController.update, {
        params: CategoryIdParam,
        body: UpdateCategoryBody,
        detail: {
          summary: '/categories/:id',
          description: 'Kategoriyi gunceller. JWT gerekli.',
          security: [{ bearerAuth: [] }],
        },
      })
      .delete('/:id', categoryController.remove, {
        params: CategoryIdParam,
        detail: {
          summary: '/categories/:id',
          description: 'Kategoriyi siler (bagli urun varsa engellenir). JWT gerekli.',
          security: [{ bearerAuth: [] }],
        },
      }),
  )
