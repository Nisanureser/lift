import type {
  CompleteWorkOrderBody,
  CreateServiceLogBody,
  ServiceLogListQuery,
  UpdateServiceLogBody,
  AddServicePartBody,
} from '../dtos/service-log.dto'
import type {
  CreateWorkOrderBody,
  UpdateWorkOrderBody,
  WorkOrderListQuery,
} from '../dtos/work-order.dto'
import type {
  CreateContractBody,
  ContractListQuery,
  UpdateContractBody,
} from '../dtos/contract.dto'

export type CreateWorkOrderInput = typeof CreateWorkOrderBody.static
export type UpdateWorkOrderInput = typeof UpdateWorkOrderBody.static
export type WorkOrderListFilters = typeof WorkOrderListQuery.static

export type WorkOrderElevatorContext = {
  id: string
  label: string
  siteId: string
  siteName: string
  customerId: string
  customerName: string
}

export type WorkOrderDto = {
  id: string
  elevatorId: string
  assignedTo: string | null
  contractId: string | null
  type: string
  status: string
  priority: string
  scheduledAt: Date | null
  startedAt: Date | null
  completedAt: Date | null
  description: string | null
  internalNotes: string | null
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
  elevator: WorkOrderElevatorContext
}

export type CreateServiceLogInput = typeof CreateServiceLogBody.static
export type CompleteWorkOrderInput = typeof CompleteWorkOrderBody.static
export type UpdateServiceLogInput = typeof UpdateServiceLogBody.static
export type ServiceLogListFilters = typeof ServiceLogListQuery.static
export type AddServicePartInput = typeof AddServicePartBody.static

export type ServiceLogPhotoDto = {
  id: string
  url: string
  fileName: string
  mimeType: string
  sortOrder: number
  createdAt: Date
}

export type ServicePartDto = {
  id: string
  productId: string
  productName: string
  productSku: string
  quantity: string
  createdAt: Date
}

export type ServiceLogDto = {
  id: string
  workOrderId: string | null
  elevatorId: string
  arrivedAt: Date | null
  leftAt: Date | null
  summary: string | null
  workPerformed: string | null
  checklist: unknown | null
  result: string
  followUpNotes: string | null
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
  photos: ServiceLogPhotoDto[]
  parts: ServicePartDto[]
}

export type CreateContractInput = typeof CreateContractBody.static
export type UpdateContractInput = typeof UpdateContractBody.static
export type ContractListFilters = typeof ContractListQuery.static

export type ContractDto = {
  id: string
  customerId: string
  siteId: string | null
  elevatorId: string | null
  type: string
  startDate: string
  endDate: string
  visitFrequency: string
  notes: string | null
  isActive: boolean
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}

export type ServicePartInputItem = {
  productId: string
  quantity: string
}
