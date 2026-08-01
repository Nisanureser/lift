import { Elysia, t } from 'elysia'
import * as productController from '../controllers/product.controller'
import { ErrorResponse } from '../dtos/common.dto'
import {
  CreateProductBody,
  ProductIdParam,
  ProductImageParam,
  ProductListQuery,
  ProductListResponse,
  ProductResponse,
  UpdateProductBody,
  UploadProductImagesBody,
  UploadProductImagesResponse,
} from '../dtos/product.dto'
import {
  StockAdjustBody,
  StockInBody,
  StockMovementListQuery,
  StockMovementListResponse,
  StockMovementResponse,
  StockOutBody,
} from '../dtos/stock.dto'
import { authGuard } from '../middlewares/auth.middleware'

// Korunan endpoint'ler icin Swagger security tanimi
const authSecurity = [{ bearerAuth: [] }, { cookieAuth: [] }] as Array<Record<string, string[]>>

// Asansor urun CRUD ve fotograf endpoint'leri
export const productRoutes = new Elysia({ prefix: '/products', tags: ['products'] })
  .get('/', productController.list, {
    query: ProductListQuery,
    response: {
      200: ProductListResponse,
    },
    detail: {
      summary: '/products',
      description: 'Urun listesini dondurur. categoryId ile filtrelenebilir.',
    },
  })
  .get('/:id', productController.getById, {
    params: ProductIdParam,
    response: {
      200: ProductResponse,
      404: ErrorResponse,
    },
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
        response: {
          201: ProductResponse,
          401: ErrorResponse,
          404: ErrorResponse,
          409: ErrorResponse,
          422: ErrorResponse,
        },
        detail: {
          summary: '/products',
          description: 'Yeni urun olusturur. JWT gerekli.',
          security: authSecurity,
        },
      })
      .patch('/:id', productController.update, {
        params: ProductIdParam,
        body: UpdateProductBody,
        response: {
          200: ProductResponse,
          401: ErrorResponse,
          404: ErrorResponse,
          409: ErrorResponse,
          422: ErrorResponse,
        },
        detail: {
          summary: '/products/:id',
          description: 'Urun bilgilerini gunceller. JWT gerekli.',
          security: authSecurity,
        },
      })
      .delete('/:id', productController.remove, {
        params: ProductIdParam,
        response: {
          204: t.Void(),
          401: ErrorResponse,
          404: ErrorResponse,
        },
        detail: {
          summary: '/products/:id',
          description: 'Urunu ve fotograflarini siler. JWT gerekli.',
          security: authSecurity,
        },
      })
      .post('/:id/images', productController.uploadImages, {
        params: ProductIdParam,
        body: UploadProductImagesBody,
        response: {
          201: UploadProductImagesResponse,
          401: ErrorResponse,
          404: ErrorResponse,
          422: ErrorResponse,
        },
        detail: {
          summary: '/products/:id/images',
          description:
            'multipart/form-data ile fotograf yukler. Field adi "images" olmali (tek veya coklu dosya). JSON body kullanma. Swagger/Scalar ile test ederken gercek dosya sec.',
          security: authSecurity,
        },
      })
      .delete('/:id/images/:imageId', productController.removeImage, {
        params: ProductImageParam,
        response: {
          204: t.Void(),
          401: ErrorResponse,
          404: ErrorResponse,
        },
        detail: {
          summary: '/products/:id/images/:imageId',
          description: 'Urun fotografini siler. JWT gerekli.',
          security: authSecurity,
        },
      })
      .post('/:id/stock/in', productController.addStock, {
        params: ProductIdParam,
        body: StockInBody,
        response: {
          201: StockMovementResponse,
          401: ErrorResponse,
          404: ErrorResponse,
          422: ErrorResponse,
        },
        detail: {
          summary: '/products/:id/stock/in',
          description: 'Urun stok girisi yapar. JWT gerekli.',
          security: authSecurity,
        },
      })
      .post('/:id/stock/out', productController.removeStock, {
        params: ProductIdParam,
        body: StockOutBody,
        response: {
          201: StockMovementResponse,
          401: ErrorResponse,
          404: ErrorResponse,
          422: ErrorResponse,
        },
        detail: {
          summary: '/products/:id/stock/out',
          description: 'Urun stok cikisi yapar. Yetersiz stokta hata doner. JWT gerekli.',
          security: authSecurity,
        },
      })
      .post('/:id/stock/adjust', productController.adjustProductStock, {
        params: ProductIdParam,
        body: StockAdjustBody,
        response: {
          201: StockMovementResponse,
          401: ErrorResponse,
          404: ErrorResponse,
          422: ErrorResponse,
        },
        detail: {
          summary: '/products/:id/stock/adjust',
          description: 'Stok miktarini belirli bir degere ayarlar (sayim duzeltmesi). JWT gerekli.',
          security: authSecurity,
        },
      })
      .get('/:id/stock/movements', productController.listStockHistory, {
        params: ProductIdParam,
        query: StockMovementListQuery,
        response: {
          200: StockMovementListResponse,
          401: ErrorResponse,
          404: ErrorResponse,
        },
        detail: {
          summary: '/products/:id/stock/movements',
          description: 'Urun stok hareket gecmisini listeler. JWT gerekli.',
          security: authSecurity,
        },
      }),
  )
