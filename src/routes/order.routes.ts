import { Elysia } from 'elysia'
import * as orderController from '../controllers/order.controller'
import { ErrorResponse } from '../dtos/common.dto'
import {
  AddOrderPaymentBody,
  CreateOrderBody,
  OrderIdParam,
  OrderListQuery,
  OrderListResponse,
  OrderResponse,
} from '../dtos/order.dto'
import { authGuard } from '../middlewares/auth.middleware'

const authSecurity = [{ bearerAuth: [] }, { cookieAuth: [] }] as Array<Record<string, string[]>>

/** Fabrika malzeme siparis endpoint'leri. */
export const orderRoutes = new Elysia({ prefix: '/orders', tags: ['orders'] })
  .use(authGuard)
  .get('/', orderController.list, {
    query: OrderListQuery,
    response: {
      200: OrderListResponse,
      401: ErrorResponse,
    },
    detail: {
      summary: '/orders',
      description: 'Fabrika siparislerini listeler. Giris gerekli.',
      security: authSecurity,
    },
  })
  .get('/:id', orderController.getById, {
    params: OrderIdParam,
    response: {
      200: OrderResponse,
      401: ErrorResponse,
      404: ErrorResponse,
    },
    detail: {
      summary: '/orders/:id',
      description: 'Siparis detayi, kalemler, hareketler ve odemeler.',
      security: authSecurity,
    },
  })
  .post('/', orderController.create, {
    body: CreateOrderBody,
    response: {
      201: OrderResponse,
      401: ErrorResponse,
      404: ErrorResponse,
      422: ErrorResponse,
    },
    detail: {
      summary: '/orders',
      description: 'Yeni siparis olusturur ve stok dusumu yapar.',
      security: authSecurity,
    },
  })
  .post('/:id/payments', orderController.addPayment, {
    params: OrderIdParam,
    body: AddOrderPaymentBody,
    response: {
      200: OrderResponse,
      401: ErrorResponse,
      404: ErrorResponse,
      422: ErrorResponse,
    },
    detail: {
      summary: '/orders/:id/payments',
      description: 'Vadeli siparise kismi odeme kaydi ekler.',
      security: authSecurity,
    },
  })
