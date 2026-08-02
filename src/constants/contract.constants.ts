// Sozlesme tip sabitleri
export const CONTRACT_TYPES = {
  MAINTENANCE: 'maintenance',
  FULL_SERVICE: 'full_service',
  INSPECTION_ONLY: 'inspection_only',
} as const

export type ContractType = (typeof CONTRACT_TYPES)[keyof typeof CONTRACT_TYPES]

// Sozlesme ziyaret sikligi sabitleri
export const VISIT_FREQUENCIES = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  SEMI_ANNUAL: 'semi_annual',
  ANNUAL: 'annual',
} as const

export type VisitFrequency = (typeof VISIT_FREQUENCIES)[keyof typeof VISIT_FREQUENCIES]
