import type { CashDayParam } from '../types/report.types'
import { getCashDayDetail, getCashReport } from '../services/report.service'

/** Gunluk kasa raporunu listeler. */
export async function cashReport() {
  return getCashReport()
}

/** Secilen gune ait tahsilat detayini getirir. */
export async function cashDayDetail({ params }: { params: CashDayParam }) {
  return getCashDayDetail(params.date)
}
