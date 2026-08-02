import { t } from 'elysia'
import { CONTRACT_TYPES, VISIT_FREQUENCIES } from '../constants/contract.constants'

const ContractTypeSchema = t.Union([
  t.Literal(CONTRACT_TYPES.MAINTENANCE),
  t.Literal(CONTRACT_TYPES.FULL_SERVICE),
  t.Literal(CONTRACT_TYPES.INSPECTION_ONLY),
])

const VisitFrequencySchema = t.Union([
  t.Literal(VISIT_FREQUENCIES.MONTHLY),
  t.Literal(VISIT_FREQUENCIES.QUARTERLY),
  t.Literal(VISIT_FREQUENCIES.SEMI_ANNUAL),
  t.Literal(VISIT_FREQUENCIES.ANNUAL),
])

// Sozlesme olusturma body semasi
export const CreateContractBody = t.Object({
  siteId: t.Optional(t.String({ minLength: 1 })),
  elevatorId: t.Optional(t.String({ minLength: 1 })),
  type: ContractTypeSchema,
  startDate: t.String({ format: 'date' }),
  endDate: t.String({ format: 'date' }),
  visitFrequency: VisitFrequencySchema,
  notes: t.Optional(t.String({ minLength: 1 })),
  isActive: t.Optional(t.Boolean()),
})

// Sozlesme guncelleme body semasi
export const UpdateContractBody = t.Partial(
  t.Object({
    siteId: t.Nullable(t.String({ minLength: 1 })),
    elevatorId: t.Nullable(t.String({ minLength: 1 })),
    type: ContractTypeSchema,
    startDate: t.String({ format: 'date' }),
    endDate: t.String({ format: 'date' }),
    visitFrequency: VisitFrequencySchema,
    notes: t.Nullable(t.String({ minLength: 1 })),
    isActive: t.Boolean(),
  }),
)

export const CustomerContractParams = t.Object({
  id: t.String({ minLength: 1 }),
  contractId: t.String({ minLength: 1 }),
})

export const ContractListQuery = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
  search: t.Optional(t.String({ minLength: 1 })),
  type: t.Optional(ContractTypeSchema),
  isActive: t.Optional(t.Boolean()),
})

export const ContractResponse = t.Object({
  id: t.String(),
  customerId: t.String(),
  siteId: t.Nullable(t.String()),
  elevatorId: t.Nullable(t.String()),
  type: t.String(),
  startDate: t.String(),
  endDate: t.String(),
  visitFrequency: t.String(),
  notes: t.Nullable(t.String()),
  isActive: t.Boolean(),
  createdBy: t.Nullable(t.String()),
  createdAt: t.Date(),
  updatedAt: t.Date(),
})

export const ContractListResponse = t.Object({
  data: t.Array(ContractResponse),
  pagination: t.Object({
    page: t.Integer(),
    limit: t.Integer(),
    total: t.Integer(),
    pages: t.Integer(),
  }),
})
