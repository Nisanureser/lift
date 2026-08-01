import { t } from 'elysia'

// Telefon semasi (tesis yetkilisi icin)
const contactPhoneSchema = t.Optional(
  t.String({
    minLength: 10,
    maxLength: 20,
    pattern: '^\\+?[0-9]{10,15}$',
  }),
)

// Tesis olusturma body semasi
export const CreateSiteBody = t.Object({
  name: t.String({ minLength: 2, maxLength: 200 }),
  address: t.String({ minLength: 3 }),
  city: t.String({ minLength: 2, maxLength: 100 }),
  district: t.String({ minLength: 2, maxLength: 100 }),
  contactName: t.Optional(t.String({ minLength: 2, maxLength: 150 })),
  contactPhone: contactPhoneSchema,
  notes: t.Optional(t.String({ minLength: 1 })),
  isActive: t.Optional(t.Boolean()),
})

// Tesis guncelleme body semasi
export const UpdateSiteBody = t.Partial(CreateSiteBody)

// Musteri + tesis path param semasi
export const CustomerSiteParams = t.Object({
  id: t.String({ minLength: 1 }),
  siteId: t.String({ minLength: 1 }),
})

// Tesis listeleme query semasi
export const SiteListQuery = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
  search: t.Optional(t.String({ minLength: 1 })),
  isActive: t.Optional(t.Boolean()),
})

// Tesis yanit semasi
export const SiteResponse = t.Object({
  id: t.String(),
  customerId: t.String(),
  name: t.String(),
  address: t.String(),
  city: t.String(),
  district: t.String(),
  contactName: t.Nullable(t.String()),
  contactPhone: t.Nullable(t.String()),
  notes: t.Nullable(t.String()),
  isActive: t.Boolean(),
  createdBy: t.Nullable(t.String()),
  createdAt: t.Date(),
  updatedAt: t.Date(),
})

// Sayfalanmis tesis listesi yanit semasi
export const SiteListResponse = t.Object({
  data: t.Array(SiteResponse),
  pagination: t.Object({
    page: t.Integer(),
    limit: t.Integer(),
    total: t.Integer(),
    pages: t.Integer(),
  }),
})
