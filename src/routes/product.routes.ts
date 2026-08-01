import { Elysia, t } from 'elysia'
import * as productController from '../controllers/product.controller'
import {
  CreateProductBody,
  ProductIdParam,
  ProductImageParam,
  ProductImageResponse,
  ProductListQuery,
  ProductListResponse,
  ProductResponse,
  UpdateProductBody,
  UploadProductImagesBody,
} from '../dtos/product.dto'
import {
  StockAdjustBody,
  StockInBody,
  StockOutBody,
  StockMovementListQuery,
  StockMovementListResponse,
  StockMovementResponse,
} from '../dtos/stock.dto'
import { authGuard } from '../middlewares/auth.middleware'

const errorResponse = t.Object({ error: t.String(), code: t.Optional(t.String()) })

// Asansor urun CRUD ve fotograf endpoint'leri
export const productRoutes = new Elysia({ prefix: '/products', tags: ['products'] })
  .get('/', productController.list, {
    query: ProductListQuery,
    detail: {
      summary: '/products',
          description: 'Urun listesini dondurur. categoryId ile filtrelenebilir.',
    },
  })
  .get('/:id', productController.getById, {
    params: ProductIdParam,
    detail: {
      summary: '/products/:id',
      description: 'Tek urun detayi ve tum fotograflari.',
    },
  })
  .group('', (app) =>
    app
      .use(authGuard)
      .post('/', productController.create, {
        body: CreateProductBody,
        detail: {
          summary: '/products',
          description: 'Yeni urun olusturur. JWT gerekli.',
          security: [{ bearerAuth: [] }],
        },
      })
      .patch('/:id', productController.update, {
        params: ProductIdParam,
        body: UpdateProductBody,
        detail: {
          summary: '/products/:id',
          description: 'Urun bilgilerini gunceller. JWT gerekli.',
          security: [{ bearerAuth: [] }],
        },
      })
      .delete('/:id', productController.remove, {
        params: ProductIdParam,
        detail: {
          summary: '/products/:id',
          description: 'Urunu ve fotograflarini siler. JWT gerekli.',
          security: [{ bearerAuth: [] }],
        },
      })
      .post('/:id/images', productController.uploadImages, {
        params: ProductIdParam,
        body: UploadProductImagesBody,
        detail: {
          summary: '/products/:id/images',
          description:
            'Uruna birden fazla fotograf yukler (jpeg/png/webp, max 5MB, urun basina max 20). JWT gerekli.',
          security: [{ bearerAuth: [] }],
        },
      })
      .delete('/:id/images/:imageId', productController.removeImage, {
        params: ProductImageParam,
        detail: {
          summary: '/products/:id/images/:imageId',
          description: 'Urun fotografini siler. JWT gerekli.',
          security: [{ bearerAuth: [] }],
        },
      })
      .post('/:id/stock/in', productController.addStock, {
        params: ProductIdParam,
        body: StockInBody,
        detail: {
          summary: '/products/:id/stock/in',
          description: 'Urun stok girisi yapar. JWT gerekli.',
          security: [{ bearerAuth: [] }],
        },
      })
      .post('/:id/stock/out', productController.removeStock, {
        params: ProductIdParam,
        body: StockOutBody,
        detail: {
          summary: '/products/:id/stock/out',
          description: 'Urun stok cikisi yapar. Yetersiz stokta hata doner. JWT gerekli.',
          security: [{ bearerAuth: [] }],
        },
      })
      .post('/:id/stock/adjust', productController.adjustProductStock, {
        params: ProductIdParam,
        body: StockAdjustBody,
        detail: {
          summary: '/products/:id/stock/adjust',
          description: 'Stok miktarini belirli bir degere ayarlar (sayim duzeltmesi). JWT gerekli.',
          security: [{ bearerAuth: [] }],
        },
      })
      .get('/:id/stock/movements', productController.listStockHistory, {
        params: ProductIdParam,
        query: StockMovementListQuery,
        detail: {
          summary: '/products/:id/stock/movements',
          description: 'Urun stok hareket gecmisini listeler. JWT gerekli.',
          security: [{ bearerAuth: [] }],
        },
      }),
  )

// Swagger sema referanslari (response tipleri)
void ProductListResponse
void ProductResponse
void ProductImageResponse
void StockMovementResponse
void StockMovementListResponse
void errorResponse
