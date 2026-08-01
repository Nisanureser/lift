import { t } from 'elysia'
import { CUSTOMER_TYPES } from '../constants/customer.constants'

// Telefon numarasi semasi
const phoneSchema = t.Optional(
  t.String({
    minLength: 10,
    maxLength: 20,
    pattern: '^\\+?[0-9]{10,15}$',
  }),
)

// Ortak iletisim ve durum alanlari
const sharedCustomerFields = {
  phone: phoneSchema,
  email: t.Optional(t.String({ format: 'email' })),
  address: t.Optional(t.String({ minLength: 1 })),
  notes: t.Optional(t.String({ minLength: 1 })),
  isActive: t.Optional(t.Boolean()),
}

// Bireysel musteri olusturma semasi
export const CreateIndividualCustomerBody = t.Object({
  type: t.Literal(CUSTOMER_TYPES.INDIVIDUAL),
  firstName: t.String({ minLength: 2, maxLength: 100 }),
  lastName: t.String({ minLength: 2, maxLength: 100 }),
  nationalId: t.Optional(t.String({ minLength: 11, maxLength: 11, pattern: '^[0-9]{11}$' })),
  ...sharedCustomerFields,
})

// Kurumsal musteri olusturma semasi
export const CreateCorporateCustomerBody = t.Object({
  type: t.Literal(CUSTOMER_TYPES.CORPORATE),
  companyName: t.String({ minLength: 2, maxLength: 200 }),
  taxNumber: t.String({ minLength: 10, maxLength: 11, pattern: '^[0-9]{10,11}$' }),
  taxOffice: t.String({ minLength: 2, maxLength: 150 }),
  contactPersonName: t.Optional(t.String({ minLength: 2, maxLength: 150 })),
  ...sharedCustomerFields,
})

// Musteri olusturma body semasi (tip bazli birlesim)
export const CreateCustomerBody = t.Union([CreateIndividualCustomerBody, CreateCorporateCustomerBody])

// Musteri guncelleme body semasi (type degistirilemez)
export const UpdateCustomerBody = t.Partial(
  t.Object({
    firstName: t.String({ minLength: 2, maxLength: 100 }),
    lastName: t.String({ minLength: 2, maxLength: 100 }),
    nationalId: t.Union([t.Literal(''), t.String({ minLength: 11, maxLength: 11, pattern: '^[0-9]{11}$' })]),
    companyName: t.String({ minLength: 2, maxLength: 200 }),
    taxNumber: t.String({ minLength: 10, maxLength: 11, pattern: '^[0-9]{10,11}$' }),
    taxOffice: t.String({ minLength: 2, maxLength: 150 }),
    contactPersonName: t.String({ minLength: 2, maxLength: 150 }),
    phone: t.Optional(t.Union([t.Literal(''), t.String({ minLength: 10, maxLength: 20, pattern: '^\\+?[0-9]{10,15}$' })])),
    email: t.Union([t.Literal(''), t.String({ format: 'email' })]),
    address: t.Union([t.Literal(''), t.String({ minLength: 1 })]),
    notes: t.Union([t.Literal(''), t.String({ minLength: 1 })]),
    isActive: t.Boolean(),
    type: t.String(),
  }),
)

// Musteri listeleme query semasi
export const CustomerListQuery = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
  type: t.Optional(
    t.Union([t.Literal(CUSTOMER_TYPES.INDIVIDUAL), t.Literal(CUSTOMER_TYPES.CORPORATE)]),
  ),
  search: t.Optional(t.String({ minLength: 1 })),
  isActive: t.Optional(t.Boolean()),
})

// Musteri ID path param semasi
export const CustomerIdParam = t.Object({
  id: t.String({ minLength: 1 }),
})

// Musteri yanit semasi
export const CustomerResponse = t.Object({
  id: t.String(),
  type: t.String(),
  displayName: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  nationalId: t.Nullable(t.String()),
  companyName: t.Nullable(t.String()),
  taxNumber: t.Nullable(t.String()),
  taxOffice: t.Nullable(t.String()),
  contactPersonName: t.Nullable(t.String()),
  phone: t.Nullable(t.String()),
  email: t.Nullable(t.String()),
  address: t.Nullable(t.String()),
  notes: t.Nullable(t.String()),
  isActive: t.Boolean(),
  createdBy: t.Nullable(t.String()),
  createdAt: t.Date(),
  updatedAt: t.Date(),
})

// Sayfalanmis musteri listesi yanit semasi
export const CustomerListResponse = t.Object({
  data: t.Array(CustomerResponse),
  pagination: t.Object({
    page: t.Integer(),
    limit: t.Integer(),
    total: t.Integer(),
    pages: t.Integer(),
  }),
})
