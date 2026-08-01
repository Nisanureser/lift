import { Elysia, t } from 'elysia'
import * as customerController from '../controllers/customer.controller'
import * as siteController from '../controllers/site.controller'
import { ErrorResponse } from '../dtos/common.dto'
import {
  CreateCustomerBody,
  CustomerIdParam,
  CustomerListQuery,
  CustomerListResponse,
  CustomerResponse,
  UpdateCustomerBody,
} from '../dtos/customer.dto'
import {
  CreateSiteBody,
  CustomerSiteParams,
  SiteListQuery,
  SiteListResponse,
  SiteResponse,
  UpdateSiteBody,
} from '../dtos/site.dto'
import { authGuard } from '../middlewares/auth.middleware'

const authSecurity = [{ bearerAuth: [] }, { cookieAuth: [] }] as Array<Record<string, string[]>>

// Musteri ve musteriye bagli tesis endpoint'leri (tum islemler giris gerektirir)
export const customerRoutes = new Elysia({ prefix: '/customers', tags: ['customers'] })
  .use(authGuard)
  .get('/', customerController.list, {
    query: CustomerListQuery,
    response: {
      200: CustomerListResponse,
      401: ErrorResponse,
    },
    detail: {
      summary: '/customers',
      description: 'Musteri listesini dondurur. type ile bireysel/kurumsal filtrelenebilir. Giris gerekli.',
      security: authSecurity,
    },
  })
  .post('/', customerController.create, {
    body: CreateCustomerBody,
    response: {
      201: CustomerResponse,
      401: ErrorResponse,
      409: ErrorResponse,
      422: ErrorResponse,
    },
    detail: {
      summary: '/customers',
      description: 'Yeni bireysel veya kurumsal musteri olusturur. Giris gerekli.',
      security: authSecurity,
    },
  })
  .get('/:id/sites', siteController.list, {
    params: CustomerIdParam,
    query: SiteListQuery,
    response: {
      200: SiteListResponse,
      401: ErrorResponse,
      404: ErrorResponse,
    },
    detail: {
      summary: '/customers/:id/sites',
      description: 'Musterinin tesis / bina listesini dondurur. Giris gerekli.',
      security: authSecurity,
      tags: ['sites'],
    },
  })
  .post('/:id/sites', siteController.create, {
    params: CustomerIdParam,
    body: CreateSiteBody,
    response: {
      201: SiteResponse,
      401: ErrorResponse,
      404: ErrorResponse,
      422: ErrorResponse,
    },
    detail: {
      summary: '/customers/:id/sites',
      description: 'Musteriye yeni tesis / bina ekler. Giris gerekli.',
      security: authSecurity,
      tags: ['sites'],
    },
  })
  .get('/:id/sites/:siteId', siteController.getById, {
    params: CustomerSiteParams,
    response: {
      200: SiteResponse,
      401: ErrorResponse,
      404: ErrorResponse,
    },
    detail: {
      summary: '/customers/:id/sites/:siteId',
      description: 'Musteriye ait tek tesis detayi. Giris gerekli.',
      security: authSecurity,
      tags: ['sites'],
    },
  })
  .patch('/:id/sites/:siteId', siteController.update, {
    params: CustomerSiteParams,
    body: UpdateSiteBody,
    response: {
      200: SiteResponse,
      401: ErrorResponse,
      404: ErrorResponse,
      422: ErrorResponse,
    },
    detail: {
      summary: '/customers/:id/sites/:siteId',
      description: 'Tesis bilgilerini gunceller. Giris gerekli.',
      security: authSecurity,
      tags: ['sites'],
    },
  })
  .delete('/:id/sites/:siteId', siteController.remove, {
    params: CustomerSiteParams,
    response: {
      204: t.Void(),
      401: ErrorResponse,
      404: ErrorResponse,
    },
    detail: {
      summary: '/customers/:id/sites/:siteId',
      description: 'Tesisi siler. Giris gerekli.',
      security: authSecurity,
      tags: ['sites'],
    },
  })
  .get('/:id', customerController.getById, {
    params: CustomerIdParam,
    response: {
      200: CustomerResponse,
      401: ErrorResponse,
      404: ErrorResponse,
    },
    detail: {
      summary: '/customers/:id',
      description: 'Tek musteri detayi. Giris gerekli.',
      security: authSecurity,
    },
  })
  .patch('/:id', customerController.update, {
    params: CustomerIdParam,
    body: UpdateCustomerBody,
    response: {
      200: CustomerResponse,
      401: ErrorResponse,
      404: ErrorResponse,
      409: ErrorResponse,
      422: ErrorResponse,
    },
    detail: {
      summary: '/customers/:id',
      description: 'Musteri bilgilerini gunceller. type degistirilemez. Giris gerekli.',
      security: authSecurity,
    },
  })
  .delete('/:id', customerController.remove, {
    params: CustomerIdParam,
    response: {
      204: t.Void(),
      401: ErrorResponse,
      404: ErrorResponse,
      409: ErrorResponse,
    },
    detail: {
      summary: '/customers/:id',
      description: 'Musteriyi siler. Bagli tesis varsa engellenir. Giris gerekli.',
      security: authSecurity,
    },
  })
