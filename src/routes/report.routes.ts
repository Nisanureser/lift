import { Elysia } from 'elysia'
import * as reportController from '../controllers/report.controller'
import { ErrorResponse } from '../dtos/common.dto'
import {
  CashDayDetailResponse,
  CashDayParam,
  CashReportResponse,
} from '../dtos/report.dto'
import { authGuard } from '../middlewares/auth.middleware'

const authSecurity = [{ bearerAuth: [] }, { cookieAuth: [] }] as Array<Record<string, string[]>>

/** Finans ve kasa raporu endpoint'leri. */
export const reportRoutes = new Elysia({ prefix: '/reports', tags: ['reports'] })
  .use(authGuard)
  .get('/cash', reportController.cashReport, {
    response: {
      200: CashReportResponse,
      401: ErrorResponse,
    },
    detail: {
      summary: '/reports/cash',
      description: 'Gunluk kasa tahsilat ozeti ve liste. Giris gerekli.',
      security: authSecurity,
    },
  })
  .get('/cash/days/:date', reportController.cashDayDetail, {
    params: CashDayParam,
    response: {
      200: CashDayDetailResponse,
      401: ErrorResponse,
    },
    detail: {
      summary: '/reports/cash/days/:date',
      description: 'Belirli bir gune ait tahsilat detaylari (yyyy-MM-dd).',
      security: authSecurity,
    },
  })
