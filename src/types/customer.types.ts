import type {
  CreateCustomerBody,
  CustomerListQuery,
  UpdateCustomerBody,
} from '../dtos/customer.dto'

export type CreateCustomerInput = typeof CreateCustomerBody.static
export type UpdateCustomerInput = typeof UpdateCustomerBody.static
export type CustomerListFilters = typeof CustomerListQuery.static

export type CustomerDto = {
  id: string
  type: string
  displayName: string
  firstName: string | null
  lastName: string | null
  nationalId: string | null
  companyName: string | null
  taxNumber: string | null
  taxOffice: string | null
  contactPersonName: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  isActive: boolean
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}
