// Is emri tip sabitleri
export const WORK_ORDER_TYPES = {
  PERIODIC_MAINTENANCE: 'periodic_maintenance',
  BREAKDOWN: 'breakdown',
  INSPECTION: 'inspection',
  INSTALLATION: 'installation',
} as const

export type WorkOrderType = (typeof WORK_ORDER_TYPES)[keyof typeof WORK_ORDER_TYPES]

// Is emri durum sabitleri
export const WORK_ORDER_STATUSES = {
  PLANNED: 'planned',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  POSTPONED: 'postponed',
} as const

export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[keyof typeof WORK_ORDER_STATUSES]

// Is emri oncelik sabitleri
export const WORK_ORDER_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  URGENT: 'urgent',
} as const

export type WorkOrderPriority = (typeof WORK_ORDER_PRIORITIES)[keyof typeof WORK_ORDER_PRIORITIES]

// Gecerli durum gecisleri
export const WORK_ORDER_STATUS_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  [WORK_ORDER_STATUSES.PLANNED]: [
    WORK_ORDER_STATUSES.ASSIGNED,
    WORK_ORDER_STATUSES.CANCELLED,
    WORK_ORDER_STATUSES.POSTPONED,
  ],
  [WORK_ORDER_STATUSES.ASSIGNED]: [
    WORK_ORDER_STATUSES.IN_PROGRESS,
    WORK_ORDER_STATUSES.CANCELLED,
    WORK_ORDER_STATUSES.POSTPONED,
  ],
  [WORK_ORDER_STATUSES.IN_PROGRESS]: [
    WORK_ORDER_STATUSES.CANCELLED,
    WORK_ORDER_STATUSES.POSTPONED,
  ],
  [WORK_ORDER_STATUSES.COMPLETED]: [],
  [WORK_ORDER_STATUSES.CANCELLED]: [],
  [WORK_ORDER_STATUSES.POSTPONED]: [
    WORK_ORDER_STATUSES.PLANNED,
    WORK_ORDER_STATUSES.ASSIGNED,
    WORK_ORDER_STATUSES.CANCELLED,
  ],
}
