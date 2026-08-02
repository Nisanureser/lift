import { t } from 'elysia'

export const CashDayParam = t.Object({
  date: t.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
})

export const CashTransactionResponse = t.Object({
  id: t.String(),
  orderId: t.String(),
  amount: t.String(),
  createdAt: t.Date(),
  kind: t.Union([t.Literal('pesin'), t.Literal('vadeli_odeme')]),
})

export const DailyCashEntryResponse = t.Object({
  dateKey: t.String(),
  total: t.String(),
  transactionCount: t.Number(),
})

export const CashReportSummaryResponse = t.Object({
  todayTotal: t.String(),
  monthTotal: t.String(),
  allTimeTotal: t.String(),
  dayCount: t.Number(),
})

export const CashReportResponse = t.Object({
  summary: CashReportSummaryResponse,
  days: t.Array(DailyCashEntryResponse),
})

export const CashDayDetailResponse = t.Object({
  dateKey: t.String(),
  total: t.String(),
  transactions: t.Array(CashTransactionResponse),
})
