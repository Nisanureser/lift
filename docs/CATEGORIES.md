# Kategoriler

## Basit Anlatim

Urunleri gruplamak icin **kategoriler** vardir. Ornek: "Motorlar", "Halatlar", "Elektronik".

- Giris yaptiktan sonra kategorileri **listeleyebilir** ve **detayina bakabilirsin**.
- Yeni kategori **ekleyebilir**, adini ve aciklamasini **degistirebilir**, gerekirse **silebilirsin**.
- Bir kategoriye bagli urun varsa o kategori **silinemez**; once urunleri baska kategoriye tasimak gerekir.
- Kategori **aktif** veya **pasif** olabilir. Pasif kategoriye yeni urun eklenemez.

Her sey giris sonrasi calisir; misafir kullanici kategori goremez.

---

## Yapilanlar (Teknik)

### Endpoint'ler

Tum endpoint'ler `authGuard` arkasinda.

| Metod | Yol | Aciklama |
|-------|-----|----------|
| GET | `/categories` | Sayfali liste, arama, aktif filtresi |
| GET | `/categories/:id` | Tek kategori |
| POST | `/categories` | Olustur |
| PATCH | `/categories/:id` | Guncelle |
| DELETE | `/categories/:id` | Sil (bagli urun varsa 409) |

### Olusturma body

```json
{
  "name": "Motorlar",
  "description": "Asansor motorlari",
  "isActive": true
}
```

### Liste query

```
GET /categories?page=1&limit=20&search=motor&isActive=true
```

### Veritabani (`categories`)

| Alan | Aciklama |
|------|----------|
| id | Benzersiz kimlik |
| name | Kategori adi (min 2 karakter) |
| description | Aciklama (min 3 karakter) |
| isActive | Aktif mi |
| createdAt, updatedAt | Zaman damgalari |

### Is kurallari

- Ayni isimde kategori varsa **409 CATEGORY_EXISTS**
- Silmede bagli urun varsa **409 CATEGORY_HAS_PRODUCTS**
- Urun olustururken kategori **aktif** olmali

### Ilgili dosyalar

```
src/routes/category.routes.ts
src/controllers/category.controller.ts
src/services/category.service.ts
src/dtos/category.dto.ts
src/database/schema/categories.ts
```
