import { Elysia, t } from 'elysia'
import * as serviceLogController from '../controllers/service-log.controller'
import { ErrorResponse } from '../dtos/common.dto'
import {
  AddServicePartBody,
  CreateServiceLogBody,
  ServiceLogIdParam,
  ServiceLogListResponse,
  ServiceLogPartParams,
  ServiceLogResponse,
  UpdateServiceLogBody,
  ServicePartListResponse,
} from '../dtos/service-log.dto'
import { authGuard } from '../middlewares/auth.middleware'

const authSecurity = [{ bearerAuth: [] }, { cookieAuth: [] }] as Array<Record<string, string[]>>

// Servis kaydi endpoint'leri (tum islemler giris gerektirir)
export const serviceLogRoutes = new Elysia({ prefix: '/service-logs', tags: ['service-logs'] })
  .use(authGuard)
  .post('/', serviceLogController.create, {
    body: CreateServiceLogBody,
    response: {
      201: ServiceLogResponse,
      401: ErrorResponse,
      404: ErrorResponse,
      422: ErrorResponse,
    },
    detail: {
      summary: '/service-logs',
      description: 'Is emri olmadan ad-hoc servis kaydi olusturur.',
      security: authSecurity,
    },
  })
  .get('/:id', serviceLogController.getById, {
    params: ServiceLogIdParam,
    response: {
      200: ServiceLogResponse,
      401: ErrorResponse,
      404: ErrorResponse,
    },
    detail: {
      summary: '/service-logs/:id',
      description: 'Servis kaydi detayini dondurur.',
      security: authSecurity,
    },
  })
  .patch('/:id', serviceLogController.update, {
    params: ServiceLogIdParam,
    body: UpdateServiceLogBody,
    response: {
      200: ServiceLogResponse,
      401: ErrorResponse,
      404: ErrorResponse,
      422: ErrorResponse,
    },
    detail: {
      summary: '/service-logs/:id',
      description: 'Servis kaydini gunceller.',
      security: authSecurity,
    },
  })
  .delete('/:id', serviceLogController.remove, {
    params: ServiceLogIdParam,
    response: {
      204: t.Null(),
      401: ErrorResponse,
      404: ErrorResponse,
    },
    detail: {
      summary: '/service-logs/:id',
      description: 'Servis kaydini soft delete ile siler.',
      security: authSecurity,
    },
  })
  .post('/:id/photos', serviceLogController.uploadPhoto, {
    params: ServiceLogIdParam,
    body: t.Object({
      file: t.File(),
    }),
    type: 'multipart/form-data',
    response: {
      200: ServiceLogResponse,
      401: ErrorResponse,
      404: ErrorResponse,
      422: ErrorResponse,
    },
    detail: {
      summary: '/service-logs/:id/photos',
      description: 'Servis kaydina fotograf yukler (multipart/form-data, file alani).',
      security: authSecurity,
    },
  })
  .get('/:id/parts', serviceLogController.listParts, {
    params: ServiceLogIdParam,
    response: {
      200: ServicePartListResponse,
      401: ErrorResponse,
      404: ErrorResponse,
    },
    detail: {
      summary: '/service-logs/:id/parts',
      description: 'Servis kaydinda kullanilan parcalari listeler.',
      security: authSecurity,
      tags: ['service-parts'],
    },
  })
  .post('/:id/parts', serviceLogController.addPart, {
    params: ServiceLogIdParam,
    body: AddServicePartBody,
    response: {
      200: ServiceLogResponse,
      401: ErrorResponse,
      404: ErrorResponse,
      422: ErrorResponse,
    },
    detail: {
      summary: '/service-logs/:id/parts',
      description: 'Servis kaydina parca ekler ve stoktan dusurur.',
      security: authSecurity,
      tags: ['service-parts'],
    },
  })
