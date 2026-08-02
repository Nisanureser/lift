import { and, eq, ne, sql } from 'drizzle-orm'

import { ORDER_PAYMENT_METHODS, ORDER_STATUSES } from '../constants/order.constants'
import { db } from '../database'
import { orderPayments, orders } from '../database/schema'
import type {
  CashDayDetailDto,
  CashReportDto,
  CashTransactionDto,
  DailyCashEntryDto,
} from '../types/report.types'
import { notDeleted } from '../utils/soft-delete.util'

type CashRow = CashTransactionDto & { dateKey: string }

/** Verilen gunun baslangic anini dondurur. */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

/** Verilen gunun bitis anini dondurur. */
function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

/** Verilen ayin baslangic anini dondurur. */
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
}

/** Verilen ayin bitis anini dondurur. */
function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

/** Tarihin verilen aralikta olup olmadigini kontrol eder. */
function isWithinInterval(date: Date, interval: { start: Date; end: Date }): boolean {
  const time = date.getTime()
  return time >= interval.start.getTime() && time <= interval.end.getTime()
}

/** Tamamlanan pesin siparis tahsilatlarini ceker. */
async function fetchPesinCashRows(): Promise<CashRow[]> {
  const rows = await db
    .select({
      id: sql<string>`${orders.id} || '-sale'`,
      orderId: orders.id,
      amount: orders.total,
      createdAt: orders.createdAt,
      dateKey: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
    })
    .from(orders)
    .where(
      and(
        notDeleted(orders.deletedAt),
        eq(orders.status, ORDER_STATUSES.COMPLETED),
        ne(orders.paymentMethodId, ORDER_PAYMENT_METHODS.VADELI)
      )
    )

  return rows.map((row) => ({
    id: row.id,
    orderId: row.orderId,
    amount: String(row.amount),
    createdAt: row.createdAt,
    kind: 'pesin' as const,
    dateKey: row.dateKey,
  }))
}

/** Vadeli siparis kismi odeme tahsilatlarini ceker. */
async function fetchVadeliCashRows(): Promise<CashRow[]> {
  const rows = await db
    .select({
      id: orderPayments.id,
      orderId: orderPayments.orderId,
      amount: orderPayments.amount,
      createdAt: orderPayments.createdAt,
      dateKey: sql<string>`to_char(${orderPayments.createdAt}, 'YYYY-MM-DD')`,
    })
    .from(orderPayments)
    .innerJoin(orders, eq(orderPayments.orderId, orders.id))
    .where(
      and(
        notDeleted(orders.deletedAt),
        eq(orders.status, ORDER_STATUSES.COMPLETED),
        eq(orders.paymentMethodId, ORDER_PAYMENT_METHODS.VADELI)
      )
    )

  return rows.map((row) => ({
    id: row.id,
    orderId: row.orderId,
    amount: String(row.amount),
    createdAt: row.createdAt,
    kind: 'vadeli_odeme' as const,
    dateKey: row.dateKey,
  }))
}

/** Tum tahsilat satirlarini birlestirir. */
async function fetchAllCashRows(): Promise<CashRow[]> {
  const [pesinRows, vadeliRows] = await Promise.all([fetchPesinCashRows(), fetchVadeliCashRows()])
  return [...pesinRows, ...vadeliRows].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )
}

/** Tahsilat satirlarindan gunluk kasa ozetini uretir. */
function buildDailyEntries(rows: CashRow[]): DailyCashEntryDto[] {
  const buckets = new Map<string, { total: number; count: number }>()

  for (const row of rows) {
    const bucket = buckets.get(row.dateKey) ?? { total: 0, count: 0 }
    bucket.total += Number(row.amount)
    bucket.count += 1
    buckets.set(row.dateKey, bucket)
  }

  return Array.from(buckets.entries())
    .map(([dateKey, { total, count }]) => ({
      dateKey,
      total: total.toFixed(2),
      transactionCount: count,
    }))
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
}

/** Belirli tarih araligindaki tahsilat toplamini hesaplar. */
function sumRowsInInterval(rows: CashRow[], start: Date, end: Date): number {
  return rows.reduce((sum, row) => {
    if (isWithinInterval(row.createdAt, { start, end })) {
      return sum + Number(row.amount)
    }
    return sum
  }, 0)
}

/** Kasa raporu ozetini ve gunluk listeyi dondurur. */
export async function getCashReport(): Promise<CashReportDto> {
  const rows = await fetchAllCashRows()
  const days = buildDailyEntries(rows)
  const now = new Date()

  const todayTotal = sumRowsInInterval(rows, startOfDay(now), endOfDay(now))
  const monthTotal = sumRowsInInterval(rows, startOfMonth(now), endOfMonth(now))
  const allTimeTotal = rows.reduce((sum, row) => sum + Number(row.amount), 0)

  return {
    summary: {
      todayTotal: todayTotal.toFixed(2),
      monthTotal: monthTotal.toFixed(2),
      allTimeTotal: allTimeTotal.toFixed(2),
      dayCount: days.length,
    },
    days,
  }
}

/** Secilen gune ait tahsilat detayini dondurur. */
export async function getCashDayDetail(dateKey: string): Promise<CashDayDetailDto> {
  const rows = await fetchAllCashRows()
  const transactions = rows
    .filter((row) => row.dateKey === dateKey)
    .map(({ dateKey: _dateKey, ...transaction }) => transaction)

  const total = transactions.reduce((sum, row) => sum + Number(row.amount), 0)

  return {
    dateKey,
    total: total.toFixed(2),
    transactions,
  }
}
