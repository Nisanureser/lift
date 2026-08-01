# Kimlik Dogrulama (Auth)

## Basit Anlatim

Bu bolum, uygulamaya kimlerin girebilecegini yonetir.

- Yeni biri **kayit olabilir**: ad, e-posta, telefon ve sifre ile hesap acilir.
- Kayit olan veya daha once hesabi olan biri **giris yapabilir**: e-posta **veya** telefon + sifre yeterli.
- Giris yapinca sistem seni tanir; sonraki isteklerde "ben girdim" bilgisi otomatik gider.
- Oturum suresi dolunca **yenileme** yapilir; kullanici tekrar sifre yazmak zorunda kalmaz (refresh akisi calisiyorsa).
- **Cikis** yapinca oturum kapanir; eski giris bilgisi gecersiz olur.
- Giris yaptiktan sonra **profil bilgini** (`/auth/me`) gorebilirsin.

Giris bilgisi tarayicida **gizli cerez (cookie)** olarak tutulur. Mobil uygulama veya farkli istemciler icin **Bearer token** da desteklenir.

---

## Yapilanlar (Teknik)

### Endpoint'ler

| Metod | Yol | Giris | Aciklama |
|-------|-----|-------|----------|
| POST | `/auth/register` | Hayir | Yeni kullanici |
| POST | `/auth/login` | Hayir | Giris |
| POST | `/auth/refresh` | Hayir | Token yenileme |
| POST | `/auth/logout` | Hayir | Cikis (cookie silinir, token iptal) |
| GET | `/auth/me` | Evet | Oturumdaki kullanici |

### Kayit body

```json
{
  "username": "ahmet",
  "email": "ahmet@ornek.com",
  "phone": "+905551234567",
  "password": "sifre1234"
}
```

### Giris body

E-posta **veya** telefon; ikisi birden bos olamaz.

```json
{
  "email": "ahmet@ornek.com",
  "phone": "",
  "password": "sifre1234"
}
```

### Yanit

Register ve login yalnizca `user` doner. Token'lar **httpOnly cookie** olarak set edilir:

- `lift_access_token` — kisa omurlu erisim
- `lift_refresh_token` — uzun omurlu yenileme

Mobil fallback: `POST /auth/refresh` ve `POST /auth/logout` body'de `refreshToken` gonderilebilir.

### Web istemci

```ts
fetch('/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: '...', password: '...' }),
})
```

### Koruma (`authGuard`)

Diger modullerde her istekte cookie veya `Authorization: Bearer` kontrol edilir. Gecersiz veya eksikse **401**.

Cikista access token blacklist'e alinir; refresh token veritabanindan iptal edilir.

### Ilgili dosyalar

```
src/routes/auth.routes.ts
src/controllers/auth.controller.ts
src/services/auth.service.ts
src/services/token.service.ts
src/middlewares/auth.middleware.ts
src/utils/auth-cookie.util.ts
src/dtos/auth.dto.ts
src/database/schema/users.ts
src/database/schema/refresh-tokens.ts
src/database/schema/token-blacklist.ts
```

### Ortam degiskenleri

```
JWT_SECRET              # En az 32 karakter
JWT_ACCESS_EXPIRES_IN   # Ornek: 15m
JWT_REFRESH_EXPIRES_IN  # Ornek: 7d
COOKIE_SECURE           # Production'da true
COOKIE_SAME_SITE        # lax | strict | none
CORS_ORIGIN             # Cookie icin * yerine origin listesi
```
