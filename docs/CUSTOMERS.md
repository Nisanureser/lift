# Musteriler

## Basit Anlatim

Bu bolum **musteri kartlarini** tutar. Her kayit ya **bireysel** ya **kurumsal** olur.

**Bireysel musteri:** ad, soyad, istege bagli T.C. kimlik numarasi, telefon, e-posta, adres, not.

**Kurumsal musteri:** firma adi, vergi numarasi, vergi dairesi, istege bagli yetkili kisi adi, telefon, e-posta, adres, not.

- Giris yaptiktan sonra musterileri **listeleyebilir**, **ekleyebilir**, **duzenleyebilir**, **silebilirsin**.
- Ayni **T.C. kimlik no** veya **vergi numarasi** ile ikinci kayit acilamaz.
- Bir musteri olusturulduktan sonra **bireysel / kurumsal tipi degistirilemez**; yeni kayit acilir.
- Liste ekraninda her musteri icin `displayName` doner: bireyselde ad soyad, kurumsalda firma adi.

Tum islemler giris gerektirir.

---

## Yapilanlar (Teknik)

### Endpoint'ler

Tum route'lar `authGuard` arkasinda. Prefix: `/customers`

| Metod | Yol | Aciklama |
|-------|-----|----------|
| GET | `/customers` | Sayfali liste |
| GET | `/customers/:id` | Detay |
| POST | `/customers` | Olustur |
| PATCH | `/customers/:id` | Guncelle |
| DELETE | `/customers/:id` | Sil (204) |

### Liste query

```
GET /customers?page=1&limit=20&type=individual&search=ahmet&isActive=true
```

`type`: `individual` | `corporate`

`search`: ad, soyad, TC, firma, vergi no, vergi dairesi, yetkili, telefon, e-posta

### Bireysel olusturma

```json
{
  "type": "individual",
  "firstName": "Ahmet",
  "lastName": "Yilmaz",
  "nationalId": "12345678901",
  "phone": "+905551234567",
  "email": "ahmet@ornek.com",
  "address": "Istanbul",
  "notes": "VIP musteri"
}
```

| Alan | Zorunlu | Aciklama |
|------|---------|----------|
| `type` | Evet | `individual` |
| `firstName`, `lastName` | Evet | Min 2 karakter |
| `nationalId` | Hayir | 11 hane, doluysa unique |
| `phone`, `email`, `address`, `notes` | Hayir | Ortak alanlar |

### Kurumsal olusturma

```json
{
  "type": "corporate",
  "companyName": "ABC Asansor Ltd.",
  "taxNumber": "1234567890",
  "taxOffice": "Kadikoy",
  "contactPersonName": "Mehmet Demir",
  "phone": "+902121234567"
}
```

| Alan | Zorunlu | Aciklama |
|------|---------|----------|
| `type` | Evet | `corporate` |
| `companyName` | Evet | Firma adi |
| `taxNumber` | Evet | 10-11 hane, unique |
| `taxOffice` | Evet | Vergi dairesi |
| `contactPersonName` | Hayir | Yetkili kisi |

### Guncelleme

- `type` gonderilirse **422** (`CUSTOMER_TYPE_IMMUTABLE`)
- Bireysel kayda kurumsal alan, kurumsal kayda bireysel alan gonderilirse **422**
- Bos string (`""`) gonderilen opsiyonel alanlar `null` yapilir

### Hata kodlari

| Kod | Durum |
|-----|-------|
| `CUSTOMER_NOT_FOUND` | 404 |
| `NATIONAL_ID_EXISTS` | 409 |
| `TAX_NUMBER_EXISTS` | 409 |
| `CUSTOMER_TYPE_IMMUTABLE` | 422 |
| `INVALID_CUSTOMER_TYPE` | 422 |

### Veritabani (`customers`)

Tek tablo; tip bazli alanlar nullable. `createdBy` → `users.id`.

Migration: `drizzle/0006_customers.sql`

### Ilgili dosyalar

```
src/constants/customer.constants.ts
src/database/schema/customers.ts
src/dtos/customer.dto.ts
src/types/customer.types.ts
src/services/customer.service.ts
src/controllers/customer.controller.ts
src/routes/customer.routes.ts
```
