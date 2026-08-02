# Sozlesmeler (Contracts)

## Basit Anlatim

Musteri ile yapilan bakim / hizmet anlasmasi burada tutulur. Periyodik bakim sikligi, baslangic-bitis tarihi ve kapsam (musteri / tesis / asansor) kaydedilir.

- Sozlesme musteri altinda acilir: `/customers/:id/contracts`
- Is emrine opsiyonel olarak baglanabilir (`contractId`).
- Silme islemleri **soft delete**.

---

## Yapilanlar (Teknik)

### Endpoint'ler

Tum route'lar `authGuard` arkasinda (`customer.routes.ts` icinde).

| Metod | Yol | Aciklama |
|-------|-----|----------|
| GET | `/customers/:id/contracts` | Musteri sozlesmeleri |
| POST | `/customers/:id/contracts` | Yeni sozlesme |
| GET | `/customers/:id/contracts/:contractId` | Sozlesme detayi |
| PATCH | `/customers/:id/contracts/:contractId` | Sozlesme guncelle |
| DELETE | `/customers/:id/contracts/:contractId` | Soft delete (204) |

### Liste query

```
GET /customers/{musteri-id}/contracts?page=1&limit=20&type=maintenance&isActive=true&search=2026
```

### Olusturma body

```json
{
  "siteId": "site-id",
  "elevatorId": "elevator-id",
  "type": "maintenance",
  "startDate": "2026-01-01",
  "endDate": "2026-12-31",
  "visitFrequency": "quarterly",
  "notes": "4 periyodik bakim dahil",
  "isActive": true
}
```

| Alan | Zorunlu |
|------|---------|
| `type`, `startDate`, `endDate`, `visitFrequency` | Evet |
| `siteId`, `elevatorId`, `notes`, `isActive` | Hayir |

### Tip degerleri (`type`)

| Deger | Anlam |
|-------|-------|
| `maintenance` | Bakim sozlesmesi |
| `full_service` | Tam hizmet |
| `inspection_only` | Sadece muayene |

### Ziyaret sikligi (`visitFrequency`)

| Deger | Anlam |
|-------|-------|
| `monthly` | Aylik |
| `quarterly` | 3 ayda bir |
| `semi_annual` | 6 ayda bir |
| `annual` | Yillik |

### Kapsam kurallari

- Sadece `customerId` zorunlu — genel musteri sozlesmesi.
- `siteId` verilirse tesis kapsamli sozlesme.
- `elevatorId` verilirse `siteId` de zorunlu; asansor o tesisin altinda olmali.

### Is emri baglantisi

Is emri olustururken opsiyonel:

```json
{
  "elevatorId": "...",
  "contractId": "...",
  "type": "periodic_maintenance"
}
```

Sozlesme, is emrindeki asansorun musterisine ait olmali.

### Hata kodlari

| Kod | Durum |
|-----|-------|
| `CONTRACT_NOT_FOUND` | 404 |
| `CONTRACT_CREATE_FAILED` | 500 |
| `INVALID_CONTRACT_TYPE` | 422 |
| `INVALID_VISIT_FREQUENCY` | 422 |
| `INVALID_CONTRACT_SCOPE` | 422 |

### Ilgili dosyalar

- Schema: `src/database/schema/contracts.ts`
- Service: `src/services/contract.service.ts`
- Routes: `src/routes/customer.routes.ts` (contracts alt path)
