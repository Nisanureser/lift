import { Elysia, t } from 'elysia'
import * as customerController from '../controllers/customer.controller'
import * as elevatorController from '../controllers/elevator.controller'
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
import {
  CreateElevatorBody,
  CustomerSiteElevatorParams,
  ElevatorListQuery,
  ElevatorListResponse,
  ElevatorResponse,
  UpdateElevatorBody,
} from '../dtos/elevator.dto'
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
      description: 'Tesisi soft delete ile siler; bagli asansorler de soft delete olur. Giris gerekli.',
      security: authSecurity,
      tags: ['sites'],
    },
  })
  .get('/:id/sites/:siteId/elevators', elevatorController.list, {
    params: CustomerSiteParams,
    query: ElevatorListQuery,
    response: {
      200: ElevatorListResponse,
      401: ErrorResponse,
      404: ErrorResponse,
    },
    detail: {
      summary: '/customers/:id/sites/:siteId/elevators',
      description: 'Tesisin asansor listesini dondurur. Giris gerekli.',
      security: authSecurity,
      tags: ['elevators'],
    },
  })
  .post('/:id/sites/:siteId/elevators', elevatorController.create, {
    params: CustomerSiteParams,
    body: CreateElevatorBody,
    response: {
      201: ElevatorResponse,
      401: ErrorResponse,
      404: ErrorResponse,
      409: ErrorResponse,
      422: ErrorResponse,
    },
    detail: {
      summary: '/customers/:id/sites/:siteId/elevators',
      description: 'Tesise yeni asansor ekler. Giris gerekli.',
      security: authSecurity,
      tags: ['elevators'],
    },
  })
  .get('/:id/sites/:siteId/elevators/:elevatorId', elevatorController.getById, {
    params: CustomerSiteElevatorParams,
    response: {
      200: ElevatorResponse,
      401: ErrorResponse,
      404: ErrorResponse,
    },
    detail: {
      summary: '/customers/:id/sites/:siteId/elevators/:elevatorId',
      description: 'Tesise ait tek asansor detayi. Giris gerekli.',
      security: authSecurity,
      tags: ['elevators'],
    },
  })
  .patch('/:id/sites/:siteId/elevators/:elevatorId', elevatorController.update, {
    params: CustomerSiteElevatorParams,
    body: UpdateElevatorBody,
    response: {
      200: ElevatorResponse,
      401: ErrorResponse,
      404: ErrorResponse,
      409: ErrorResponse,
      422: ErrorResponse,
    },
    detail: {
      summary: '/customers/:id/sites/:siteId/elevators/:elevatorId',
      description: 'Asansor bilgilerini gunceller. Giris gerekli.',
      security: authSecurity,
      tags: ['elevators'],
    },
  })
  .delete('/:id/sites/:siteId/elevators/:elevatorId', elevatorController.remove, {
    params: CustomerSiteElevatorParams,
    response: {
      204: t.Void(),
      401: ErrorResponse,
      404: ErrorResponse,
    },
    detail: {
      summary: '/customers/:id/sites/:siteId/elevators/:elevatorId',
      description: 'Asansoru soft delete ile siler. Giris gerekli.',
      security: authSecurity,
      tags: ['elevators'],
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
      description: 'Musteriyi soft delete ile siler. Bagli tesis varsa engellenir. Giris gerekli.',
      security: authSecurity,
    },
  })
