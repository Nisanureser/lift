// Asansor durum sabitleri
export const ELEVATOR_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  FAULTY: 'faulty',
} as const

export type ElevatorStatus = (typeof ELEVATOR_STATUSES)[keyof typeof ELEVATOR_STATUSES]
