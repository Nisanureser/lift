import type {
  CreateElevatorBody,
  ElevatorListQuery,
  UpdateElevatorBody,
} from '../dtos/elevator.dto'

export type CreateElevatorInput = typeof CreateElevatorBody.static
export type UpdateElevatorInput = typeof UpdateElevatorBody.static
export type ElevatorListFilters = typeof ElevatorListQuery.static

export type ElevatorDto = {
  id: string
  siteId: string
  label: string
  brand: string | null
  model: string | null
  serialNumber: string | null
  capacity: string | null
  installedAt: Date | null
  status: string
  notes: string | null
  isActive: boolean
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}
