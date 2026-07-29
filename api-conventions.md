# API Kontratı ve Dokümantasyon (§13)

Ortak HTTP sözleşmesi. Endpoint listeleri:

| Yüzey | Dosya | Swagger tag öneki |
|-------|--------|-------------------|
| Public / müşteri | [`frontend-icin-api-listesi.md`](frontend-icin-api-listesi.md) | (tag adı, örn. `Auth`, `Events`) |
| Admin panel | [`admin-api-liste.md`](admin-api-liste.md) | `Admin*` |
| Canlı OpenAPI | Development: `/swagger` | Tüm minimal API’ler |

JSON property isimleri: **camelCase**.

---

## 1. Swagger endpoint grupları

Development ortamında `GET /swagger` — Bearer JWT security tanımlı.

| Tag | Kapsam |
|-----|--------|
| `System` | `GET /`, health dışı kök |
| `Auth` | `/auth/*` |
| `Customer` | `/customers/*` |
| `Categories` / `Venues` / `Events` | Public katalog |
| `Orders` / `Payments` | Checkout, ödeme, guest erişim |
| `Blog` | Public blog |
| `Raffles` | Public çekiliş katılım |
| `AdminUsers` | `/admin/users` |
| `AdminCategories` / `AdminVenues` / `AdminEvents` | Katalog CRUD |
| `AdminOrders` / `AdminTickets` | Sipariş / QR scan |
| `AdminRefunds` | İade yönetimi |
| `AdminBlog` | Blog CMS |
| `AdminRaffles` | Çekiliş planlama |
| `AdminDashboard` / `AdminAuditLogs` / `AdminReports` | Ops |

**Swagger’da yok (bilinçli):** SignalR hub’ları (`/hubs/*`), Hangfire UI (`/hangfire`), health check UI.

---

## 2. Auth convention

```http
Authorization: Bearer {accessToken}
```

| Yüzey | Policy / rol |
|-------|----------------|
| Public (çoğu) | `AllowAnonymous` veya opsiyonel Bearer (çekiliş `userId` bağlama) |
| Müşteri hesabı | `CustomerOnly` / authenticated |
| Admin | `AdminOnly` — JWT `role` = `Admin` → aksi `403` |

Login: `POST /auth/login` (admin ayrı login yok). Refresh: `POST /auth/refresh`.

---

## 3. Error response convention (ProblemDetails)

`GlobalExceptionHandler` → RFC7807 benzeri JSON:

```json
{
  "status": 409,
  "title": "Çakışma.",
  "detail": "Bu telefon ile zaten bu çekilişe katıldınız.",
  "instance": "/raffles/.../entries",
  "errorCode": "conflict"
}
```

| Exception | HTTP | `title` | Tipik `errorCode` |
|-----------|------|---------|-------------------|
| `ValidationException` | 400 | Doğrulama hatası. | `validation_failed` (+ `errors` map) |
| `AppException` (genel) | *status* | İşlem başarısız. | örn. `invalid_input`, `otp_invalid` |
| `ForbiddenException` | 403 | Yetkisiz işlem. | `forbidden` |
| `NotFoundException` | 404 | Kayıt bulunamadı. | `not_found` |
| `ConflictException` | 409 | Çakışma. | `conflict` |
| Diğer | 500 | Beklenmeyen bir hata oluştu. | — |

`errorCode` / `errors` alanları `extensions` üzerinden camelCase gelir. Rate limit (`429`): ASP.NET RateLimiter JSON (`title`, `detail`, `retryAfter`) — ProblemDetails değil.

Correlation: isteklerde `X-Correlation-ID` (yoksa üretilir); log’lara yazılır.

---

## 4. Sayfalama / filtre query convention

**Query parametreleri**

| Param | Anlam | Not |
|-------|--------|-----|
| `page` | 1-based sayfa | `Math.Max(1, page)` |
| `pageSize` | sayfa boyutu | clamp `1..max` |
| `search` | serbest metin | trim; endpoint’e göre |
| `status` | enum adı | case-insensitive parse; geçersiz → `400` |

**Varsayılanlar**

| Yüzey | `pageSize` default | Max |
|-------|-------------------|-----|
| Public blog list | 12 | 50 |
| Admin listeler (users, orders, audit, blog, raffles, …) | 20 | 100 |
| Admin raffle entries | 50 | 100 |

**Paged response şekli** (tüm `Paged*Dto`):

```json
{
  "items": [ ... ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 42
}
```

Filtre örnekleri: `categoryId` / `categorySlug` / `tagSlug` (blog), `status` (sipariş, kullanıcı, çekiliş, entry), `fromUtc`/`toUtc` (rapor/audit).

---

## 5. Frontend kontrat paylaşımı

| Tüketici | Kaynak |
|----------|--------|
| Public site | `frontend-icin-api-listesi.md` + bu dosya |
| Admin panel | `admin-api-liste.md` + bu dosya |
| Keşif / deneme | Development Swagger UI |

Yeni endpoint: ilgili listeye + Swagger `.WithTags` / `.WithOpenApi` eklenir; convention buradan sapmaz.
