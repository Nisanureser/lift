# Nginx ile Mobil / Ekip Testi

Bu rehber, Lift API'yi gelistirirken ekip arkadasinin mobil cihazdan test etmesi icin nginx kurulumunu anlatir.

---

## Senaryo 1: Ayni WiFi (en kolay)

Sen Mac'te API gelistiriyorsun, arkadasin ayni agda mobil test edecek.

### Adim 1 - API'yi calistir

```bash
bun run dev
```

API `http://localhost:3000` uzerinde ayaga kalkar.

### Adim 2 - Mac'in yerel IP'sini bul

```bash
ipconfig getifaddr en0
```

Ornek cikti: `192.168.1.42`

### Adim 3 - nginx kur (Mac)

```bash
brew install nginx
```

### Adim 4 - Lift nginx config'ini bagla

```bash
sudo cp nginx/lift.local.conf /opt/homebrew/etc/nginx/servers/lift.conf
```

Intel Mac kullaniyorsan path farkli olabilir:

```bash
sudo cp nginx/lift.local.conf /usr/local/etc/nginx/servers/lift.conf
```

Config test:

```bash
sudo nginx -t
```

nginx baslat / yeniden yukle:

```bash
sudo brew services start nginx
# veya
sudo nginx -s reload
```

### Adim 5 - Mobil uygulamada base URL

Arkadasinin telefonunda API adresi:

```
http://192.168.1.42:8080
```

Ornekler:

- Swagger: `http://192.168.1.42:8080/swagger`
- Login: `POST http://192.168.1.42:8080/auth/login`

### Adim 6 - .env CORS

Mobil uygulama farkli origin'den istek atacaksa `.env` icinde:

```env
CORS_ORIGIN=*
```

---

## Senaryo 2: nginx olmadan (daha basit, ayni WiFi)

nginx sart degil. API zaten `0.0.0.0:3000` dinliyorsa dogrudan:

```
http://192.168.1.42:3000
```

Mac guvenlik duvarinda 3000 portunu acman gerekebilir:

**Sistem Ayarlari > Ag > Guvenlik Duvari > Secenekler**

---

## Senaryo 3: Farkli sehir / farkli ag (SENIN DURUMUN)

Arkadasin baska sehirdeyse nginx ve yerel IP yetmez. Bilgisayarindaki API'yi internete acman lazim.

**En kolay yol: Cloudflare Tunnel (ucretsiz, HTTPS)**

### Adim 1 - API'yi calistir

```bash
bun run dev
```

### Adim 2 - cloudflared kur

```bash
brew install cloudflared
```

### Adim 3 - Tunnel ac

```bash
cloudflared tunnel --url http://localhost:3000
```

Terminalde su tarz bir URL verir:

```
https://random-kelime.trycloudflare.com
```

### Adim 4 - URL'yi arkadasina ver

Mobil uygulamada base URL:

```
https://random-kelime.trycloudflare.com
```

Ornekler:

- Swagger: `https://random-kelime.trycloudflare.com/swagger`
- Login: `POST https://random-kelime.trycloudflare.com/auth/login`

**Onemli:**
- Terminali kapatinca tunnel kapanir, URL degisir
- Her `cloudflared` calistirdiginda yeni URL alabilirsin
- `.env` icinde `CORS_ORIGIN=*` olsun

### Alternatif: ngrok

```bash
brew install ngrok
ngrok http 3000
```

`https://xxxx.ngrok-free.app` URL'ini arkadasina ver.

---

## Senaryo 4: VPS uzerinde nginx (production benzeri)

Sunucuda:

```bash
# API'yi PM2/systemd ile 3000'de calistir
bun run start

# nginx config
sudo cp nginx/lift.local.conf /etc/nginx/sites-available/lift
sudo ln -s /etc/nginx/sites-available/lift /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Domain varsa `server_name api.lift.com;` ve SSL (Let's Encrypt) ekle.

---

## Login (email veya telefon ile)

Kayit:

```json
POST /auth/register
{
  "username": "johndoe",
  "email": "john@test.com",
  "phone": "5551234567",
  "password": "12345678"
}
```

Giris (email ile):

```json
POST /auth/login
{
  "email": "john@test.com",
  "password": "12345678"
}
```

Giris (telefon ile):

```json
POST /auth/login
{
  "phone": "5551234567",
  "password": "12345678"
}
```

**Not:** Email ve telefonu ayni istekte birlikte gonderme, biri yeterli.

---

## Sorun giderme

| Problem | Cozum |
|---------|--------|
| Mobilden baglanamiyor | Ayni WiFi'de misiniz kontrol et |
| Connection refused | API calisiyor mu: `curl localhost:3000/health` |
| 502 Bad Gateway | nginx ayakta ama API kapali |
| CORS hatasi | `.env` -> `CORS_ORIGIN=*` |
| Mac firewall | 8080 veya 3000 portunu ac |

---

## Ozet

```
Mobil cihaz
    │
    ▼
http://SENIN_IP:8080   (nginx)
    │
    ▼
http://127.0.0.1:3000  (Lift API / Bun)
    │
    ▼
PostgreSQL (Docker)
```

Ayni WiFi icin en hizli yol:

1. `bun run dev`
2. `ipconfig getifaddr en0` ile IP'yi al
3. nginx kur ve `nginx/lift.local.conf` kullan
4. Mobil base URL: `http://IP:8080`
