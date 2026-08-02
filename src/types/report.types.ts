/** Kasa raporu ozet alanlari. */
export type CashReportSummary = {
  todayTotal: string
  monthTotal: string
  allTimeTotal: string
  dayCount: number
}

/** Gunluk kasa satiri. */
export type DailyCashEntryDto = {
  dateKey: string
  total: string
  transactionCount: number
}

/** Tek tahsilat hareketi. */
export type CashTransactionDto = {
  id: string
  orderId: string
  amount: string
  createdAt: Date
  kind: 'pesin' | 'vadeli_odeme'
}

/** Kasa raporu listesi yaniti. */
export type CashReportDto = {
  summary: CashReportSummary
  days: DailyCashEntryDto[]
}

/** Gun detay yaniti. */
export type CashDayDetailDto = {
  dateKey: string
  total: string
  transactions: CashTransactionDto[]
}

/** Gun detay route parametresi. */
export type CashDayParam = {
  date: string
}
