import { Elysia, t } from 'elysia'
import * as workOrderController from '../controllers/work-order.controller'
import { ErrorResponse } from '../dtos/common.dto'
import {
  CompleteWorkOrderBody,
  CompleteWorkOrderResponse,
} from '../dtos/service-log.dto'
import {
  CreateWorkOrderBody,
  UpdateWorkOrderBody,
  UpdateWorkOrderStatusBody,
  WorkOrderIdParam,
  WorkOrderListQuery,
  WorkOrderListResponse,
  WorkOrderResponse,
} from '../dtos/work-order.dto'
import { authGuard } from '../middlewares/auth.middleware'

const authSecurity = [{ bearerAuth: [] }, { cookieAuth: [] }] as Array<Record<string, string[]>>

// Is emri endpoint'leri (tum islemler giris gerektirir)
export const workOrderRoutes = new Elysia({ prefix: '/work-orders', tags: ['work-orders'] })
  .use(authGuard)
  .get('/', workOrderController.list, {
    query: WorkOrderListQuery,
    response: {
      200: WorkOrderListResponse,
      401: ErrorResponse,
    },
    detail: {
      summary: '/work-orders',
      description: 'Is emirlerini listeler. Durum, teknisyen, musteri ve tarih filtreleri desteklenir.',
      security: authSecurity,
    },
  })
  .post('/', workOrderController.create, {
    body: CreateWorkOrderBody,
    response: {
      201: WorkOrderResponse,
      401: ErrorResponse,
      404: ErrorResponse,
      422: ErrorResponse,
    },
    detail: {
      summary: '/work-orders',
      description: 'Yeni is emri olusturur.',
      security: authSecurity,
    },
  })
  .get('/:id', workOrderController.getById, {
    params: WorkOrderIdParam,
    response: {
      200: WorkOrderResponse,
      401: ErrorResponse,
      404: ErrorResponse,
    },
    detail: {
      summary: '/work-orders/:id',
      description: 'Is emri detayini dondurur.',
      security: authSecurity,
    },
  })
  .patch('/:id', workOrderController.update, {
    params: WorkOrderIdParam,
    body: UpdateWorkOrderBody,
    response: {
      200: WorkOrderResponse,
      401: ErrorResponse,
      404: ErrorResponse,
      422: ErrorResponse,
    },
    detail: {
      summary: '/work-orders/:id',
      description: 'Is emrini gunceller.',
      security: authSecurity,
    },
  })
  .patch('/:id/status', workOrderController.updateStatus, {
    params: WorkOrderIdParam,
    body: UpdateWorkOrderStatusBody,
    response: {
      200: WorkOrderResponse,
      401: ErrorResponse,
      404: ErrorResponse,
      422: ErrorResponse,
    },
    detail: {
      summary: '/work-orders/:id/status',
      description: 'Is emri durum gecisini yapar.',
      security: authSecurity,
    },
  })
  .post('/:id/complete', workOrderController.complete, {
    params: WorkOrderIdParam,
    body: CompleteWorkOrderBody,
    response: {
      200: CompleteWorkOrderResponse,
      401: ErrorResponse,
      404: ErrorResponse,
      422: ErrorResponse,
    },
    detail: {
      summary: '/work-orders/:id/complete',
      description: 'Is emrini tamamlar ve servis kaydi olusturur.',
      security: authSecurity,
    },
  })
  .delete('/:id', workOrderController.remove, {
    params: WorkOrderIdParam,
    response: {
      204: t.Null(),
      401: ErrorResponse,
      404: ErrorResponse,
    },
    detail: {
      summary: '/work-orders/:id',
      description: 'Is emrini soft delete ile siler.',
      security: authSecurity,
    },
  })
