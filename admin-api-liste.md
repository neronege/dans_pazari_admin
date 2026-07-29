# Admin API Listesi

Frontend **admin paneli** için HTTP sözleşmesi. Müşteri / public API’ler: `frontend-icin-api-listesi.md`.  
**Ortak kontrat (auth, hata, sayfalama, Swagger):** [`api-conventions.md`](api-conventions.md).

ASP.NET Core JSON: **camelCase**.

Yetkilendirme (aksi belirtilmedikçe):

```http
Authorization: Bearer {accessToken}
```

Token’da **Admin** rolü gerekir (`AdminOnly` policy). Aksi halde `403`.

Ortak hata gövdesi (ProblemDetails): `api-conventions.md` §3 · özet `frontend-icin-api-listesi.md` → Ortak hata gövdesi.

Sayfalama: `page` / `pageSize` → `{ items, page, pageSize, totalCount }` (admin default 20, max 100) — `api-conventions.md` §4.

Development: `/swagger` (Admin* tag’leri).

---

## Auth

Admin paneli Identity üzerinden giriş yapar (ayrı `/auth/admin/login` yok). JWT `role` claim = `Admin` olmalı.

### `POST /auth/login`

Müşteri ile aynı endpoint (`frontend-icin-api-listesi.md` → Auth). Admin kullanıcı için response:

```json
{
  "tokens": { "accessToken": "...", "refreshToken": "...", "accessTokenExpiresAtUtc": "...", "refreshTokenExpiresAtUtc": "..." },
  "user": {
    "id": "...",
    "email": "admin@biletplatform.local",
    "firstName": "Platform",
    "lastName": "Admin",
    "role": "Admin",
    "emailConfirmed": true
  }
}
```

`user.role !== "Admin"` ise panel token’ı admin API’lere göndermemelidir (`403`). Seed (dev): `admin@biletplatform.local` / `Admin123!`.

Yenileme / çıkış: `POST /auth/refresh`, `POST /auth/logout` (aynı müşteri sözleşmesi).

### `GET /auth/admin/ping`

`AdminOnly` smoke test. Customer token → `403`, token yok → `401`.

**Response `200 OK`**

```json
{
  "message": "admin access granted"
}
```

---

## Dashboard (`/admin/dashboard`)

### `GET /admin/dashboard/summary`

Operasyon özeti.

| Alan | Kaynak |
|------|--------|
| `totalSalesAmount` | `Paid` + `PartiallyRefunded` sipariş `TotalAmount` toplamı |
| `currency` | `TRY` |
| `paidOrderCount` | Aynı filtredeki sipariş adedi |
| `activeEventCount` | `Published` etkinlik |
| `pendingRefundCount` | `Pending` iade talebi |
| `generatedAtUtc` | Üretim zamanı |

---

## Reports (`/admin/reports`)

Satış filtresi: `Paid` + `PartiallyRefunded`, tarih ekseni `paidAtUtc`. Max aralık 366 gün.

| Method | Path | Not |
|--------|------|-----|
| GET | `/admin/reports/sales` | Query: `fromUtc`, `toUtc` (zorunlu). Özet + günlük `breakdown` |
| GET | `/admin/reports/sales/export` | Aynı filtre → CSV indir (`text/csv; charset=utf-8`) |
| GET | `/admin/reports/performance` | Query: `fromUtc`, `toUtc`, opsiyonel `eventId`. Etkinlik + seans satırları |

**Sales JSON:** `totalSalesAmount`, `orderCount`, `ticketCount`, `breakdown[]` (`periodStartUtc`, `salesAmount`, `orderCount`, `ticketCount`).

**CSV kolonları:** `paidAtUtc,orderNumber,status,totalAmount,currency,buyerEmail,buyerName,ticketCount`.

**Performance satırı:** `grossSalesAmount`, `ticketsSold`, `ticketsUsed`, `ticketsRefunded`, `capacity`.

---

## Audit Logs (`/admin/audit-logs`)

MediatR `AuditLogBehavior` + `IAuditableRequest` başarılı komutlardan sonra yazar (ör. kullanıcı suspend/ban/activate).

| Method | Path | Not |
|--------|------|-----|
| GET | `/admin/audit-logs` | Query: `actorUserId`, `entityType`, `entityId`, `fromUtc`, `toUtc`, `page`, `pageSize` |
| GET | `/admin/audit-logs/{id}` | Detay |

Response item: `actorUserId`, `actorEmail`, `action`, `entityType`, `entityId`, `entityDisplayName`, `oldValuesJson`, `newValuesJson`, `ipAddress`, `correlationId`, `createdAtUtc`.

---

## Hangfire

Dashboard: `GET /hangfire` (UI). **Sadece Admin** (`AdminHangfireDashboardAuthorizationFilter`).

Browser: `Authorization: Bearer` veya `?access_token={jwt}`.

Storage: PostgreSQL schema `hangfire` (`ConnectionStrings:Default`). Config: `Hangfire:*` (`Enabled`, cron’lar).

| Recurring job id | Ne yapar | Varsayılan cron |
|------------------|----------|-----------------|
| `notifications-dispatch` | Pending bildirim gönder / retry | her dakika |
| `reservation-expiry` | Süresi dolan stok rezervasyonunu serbest bırak | her dakika |
| `event-reminder-sweep` | Yaklaşan seanslar için `event.reminder` enqueue | `*/30 * * * *` |
| `story-expiry` | `ExpiresAtUtc` geçmiş story → `IsActive=false` (+ SignalR `StoryUpdated`) | `*/15 * * * *` |
| `raffle-draw` | `ends_at_utc` geçmiş Open/Scheduled çekiliş → kazanan seç + `Completed`; kazananlara `raffle.winner` e-posta+SMS kuyruğa | her dakika (`RaffleDrawCron`) |

---

## Categories (`/admin/categories`)

### `GET /admin/categories`

Admin ağaç — aktif + pasif (silinmemiş).

### `GET /admin/categories/{id}`

Admin detay (pasif dahil).

### `POST /admin/categories`

```json
{
  "name": "Konser",
  "slug": null,
  "description": "Canlı müzik",
  "parentCategoryId": null,
  "sortOrder": 0,
  "isActive": true
}
```

| Alan | Tip | Zorunlu | Not |
|------|-----|---------|-----|
| name | string | evet | max 150; slug boşsa isimden üretilir |
| slug | string \| null | hayır | Türkçe normalize; çakışmada `-2`, `-3` |
| description | string \| null | hayır | |
| parentCategoryId | guid \| null | hayır | üst kategori |
| sortOrder | int | hayır | default 0 |
| isActive | bool \| null | hayır | default true |

**Response `201 Created`** — detay DTO.

### `PUT /admin/categories/{id}`

Güncelleme (name, slug, parent, sortOrder, isActive).

### `PATCH /admin/categories/{id}/active`

```json
{ "isActive": false }
```

### `PUT /admin/categories/reorder`

```json
{
  "items": [
    { "id": "...", "sortOrder": 0 },
    { "id": "...", "sortOrder": 1 }
  ]
}
```

**Response `204 No Content`**

### `DELETE /admin/categories/{id}`

Soft delete. Alt kategorilerin `parentCategoryId` null yapılır (kök olur).

**Response `204 No Content`**

---

## Venues (`/admin/venues`)

Fotoğraflar JSON gövdede değil; create/update **multipart/form-data**. Alanlar form field, görseller `Photos` dosya listesi (aynı isimle birden fazla file). Optimize → WebP → R2 (`venues/{venueId}/photos/...`). İstek üst limiti 20 MB; dosya başı max 8 MB; istek başına max 20 fotoğraf.

### `GET /admin/venues`

Admin liste — aktif + pasif. Query: `city`, `search`. Özet DTO’da `coverImageUrl` (ilk fotoğraf, varsa).

### `GET /admin/venues/{id}`

Admin detay (pasif dahil) — `photos[]`: `id`, `imageKey`, `imageUrl`, `sortOrder`.

### `POST /admin/venues`

`Content-Type: multipart/form-data`

| Alan | Tip | Zorunlu | Not |
|------|-----|---------|-----|
| name | string | evet | max 200 |
| slug | string | hayır | boşsa isimden üretilir |
| city | string | evet | max 100 |
| address | string | evet | |
| district | string | hayır | max 100 |
| latitude | number | hayır | -90 … 90 |
| longitude | number | hayır | -180 … 180 |
| description | string | hayır | |
| capacity | int | hayır | > 0 |
| isActive | bool | hayır | default true |
| Photos | file[] | hayır | jpeg/png/webp/gif; liste halinde |

**Response `201 Created`** — detay DTO (`photos` dahil).

### `PUT /admin/venues/{id}`

`multipart/form-data` — aynı alanlar. `Photos` **verilmezse** mevcut galeri korunur; verilirse listeye **eklenir** (replace değil).

### `POST /admin/venues/{id}/photos`

Yalnızca ek fotoğraf. Form: `Photos` (en az 1 dosya).

### `DELETE /admin/venues/{id}/photos/{photoId}`

Tek fotoğraf soft-delete + R2 best-effort silme. Response: güncel detay DTO.

### `PATCH /admin/venues/{id}/active`

```json
{ "isActive": false }
```

### `DELETE /admin/venues/{id}`

Soft delete. Bağlı etkinlik varsa DB RESTRICT ile engellenir.

**Response `204 No Content`**

---

## Events (`/admin/events`)

Draft dahil tüm status’ler. Inactive bilet tipleri de görünür.

| Method | Path | Not |
|--------|------|-----|
| GET | `/admin/events` | Query: `categoryId`, `city`, `search`, `status` |
| GET | `/admin/events/{id}` | Detay |
| POST | `/admin/events` | Oluştur (draft). Body: `title`, `description`, `categoryId`, `venueId`, opsiyonel `slug`, `shortDescription`, `isFeatured`, `metaTitle`, `metaDescription` |
| PUT | `/admin/events/{id}` | Düzenle |
| PATCH | `/admin/events/{id}/publish` | Yayınla |
| PATCH | `/admin/events/{id}/unpublish` | Yayından kaldır |
| PATCH | `/admin/events/{id}/cancel` | İptal |
| PATCH | `/admin/events/{id}/featured` | Body: `{ "isFeatured": true }` |
| DELETE | `/admin/events/{id}` | Soft-delete |
| POST | `/admin/events/{id}/photos` | Multipart `Photos[]` — galeriye ekler (jpeg/png/webp/gif, max 8 MB/dosya, max 20). İlk foto → `coverImageUrl` |
| DELETE | `/admin/events/{id}/photos/{photoId}` | Galeriden tek foto sil |
| POST | `/admin/events/{id}/banner` | Multipart `file` — anasayfa banner (geniş format). Key: `events/{id}/banner/...` |
| DELETE | `/admin/events/{id}/banner` | Banner sil |
| POST | `/admin/events/{id}/cover` | **Eski alias** — tek `file` → galeriye ekler |
| DELETE | `/admin/events/{id}/cover` | **Eski alias** — tüm galeriyi temizler |
| POST | `/admin/events/{eventId}/sessions` | Body: `startsAtUtc`, `endsAtUtc`, `doorOpensNote?` |
| PUT | `/admin/events/{eventId}/sessions/{sessionId}` | Seans düzenle |
| PATCH | `/admin/events/{eventId}/sessions/{sessionId}/cancel` | Seans iptal |
| DELETE | `/admin/events/{eventId}/sessions/{sessionId}` | Seans soft-delete |
| POST | `/admin/events/{eventId}/sessions/{sessionId}/ticket-types` | Body: `name`, `price`, `capacity`, `description?`, `currency?`, `sortOrder?`, `maxPerOrder?`, `isActive?` |
| PUT | `/admin/events/{eventId}/sessions/{sessionId}/ticket-types/{ticketTypeId}` | Bilet tipi güncelle |
| DELETE | `/admin/events/{eventId}/sessions/{sessionId}/ticket-types/{ticketTypeId}` | Soft-delete |

**Kapak yükleme (R2):** Backend S3 credential tutmaz. `WorkerR2Storage` → Cloudflare Worker `PUT /upload` (`x-internal-token`, `x-object-key`) → R2 binding. Public URL: `R2:PublicBaseUrl/{key}` veya `{WorkerBaseUrl}/public/{key}`.

### `POST /admin/events/{eventId}/start-bulk-refunds`

Etkinlikteki aktif biletler için toplu `BulkEvent` iade talepleri oluşturur (otomatik onaylamaz; admin `refund-requests` üzerinden onaylar).

```json
{ "reason": "Etkinlik iptal edildi" }
```

**Response `200`:** `{ "eventId", "createdCount", "skippedCount" }` — açık talebi olan biletler skip edilir.

---

## Orders / Tickets

| Method | Path | Not |
|--------|------|-----|
| GET | `/admin/orders` | Query: `search` (orderNumber/email/ad), `status`, `page`, `pageSize` |
| GET | `/admin/orders/{id}` | Detay (kalemler + biletler; aktif biletlerde QR) |
| POST | `/admin/orders/{id}/fulfill-payment` | Manuel / sandbox fulfill |
| POST | `/admin/tickets/scan` | Kapı QR doğrulama |

### `GET /admin/orders`

Sayfalı sipariş listesi. Response: `{ items, page, pageSize, totalCount }` — item’da `buyerEmail`, `totalAmount`, `status`, `ticketCount`.

### `GET /admin/orders/{id}`

Sipariş detayı (müşteri `OrderDetailDto` ile aynı şekil).

### `POST /admin/orders/{id}/fulfill-payment`

Ödeme başarılı simülasyonu / manuel fulfill. iyzico success path aynı `IOrderFulfillmentService`’i kullanır.

Yapar: `MarkPaid` → `Active` bilet + QR → `ConfirmSale` → PDF/R2 → `notifications` kuyruğuna `ticket.delivered`.

Idempotent: zaten paid + bilet varsa tekrar üretmez.

**Response `200 OK`:** `orderId`, `orderNumber`, `status`, `ticketCount`, `alreadyFulfilled`.

### `POST /admin/tickets/scan`

Kapı QR doğrulama. Kamerayı frontend okur; ham QR string’i gönderir. Rate limit: `QrScan`.

```json
{ "payload": "BP1...." }
```

**Response `200 OK`** (her zaman 200 — sonuç `resultCode` ile)

| Alan | Not |
|------|-----|
| isSuccessful | İlk geçerli okutmada `true` |
| resultCode | `valid` / `invalid` / `not_found` / `already_used` / `cancelled` / `refunded` / `not_active` |
| resultMessage | İnsan okunur mesaj |
| ticketId / ticketNumber / holderName | Bulunursa |
| eventId / sessionId | SignalR grupları için |
| usedAtUtc | Kullanım zamanı |
| scannedAtUtc | Bu denemenin zamanı |

Her deneme `ticket_scan_logs`’a yazılır. İlk `valid` → bilet `used`.

#### SignalR — kapı monitörü + admin bildirimleri

Hub: `/hubs/platform` (Admin JWT; WebSocket için `?access_token=`).

| Hub metodu | Açıklama |
|------------|----------|
| `JoinAdminNotifications` / `LeaveAdminNotifications` | Ops bildirimleri (`admin-notify`) |
| `JoinGateMonitor` / `LeaveGateMonitor` | Tüm taramalar |
| `JoinEventGate(eventId)` | Etkinlik filtresi |
| `JoinSessionGate(sessionId)` | Seans filtresi |

Sunucu event’leri:

| Event | Ne zaman | Payload |
|-------|----------|---------|
| `TicketScanned` | QR tarama | Scan response DTO ile aynı |
| `AdminNotification` | `refund.requested`, `order.paid` | `{ type, title, message, entityType, entityId, payloadJson, occurredAtUtc }` |

Redis backplane: `AddSignalR().AddStackExchangeRedis` (`Redis:ConnectionString`, channel prefix `{InstanceName}signalr:`).

Story hub (public, opsiyonel): `/hubs/stories` — `JoinStoryFeed` / `LeaveStoryFeed`; event `StoryUpdated` (Story §9 CRUD bağlanınca yayınlanır).

---

## Refunds (`/admin/refund-requests`)

Müşteri talebi (admin değil): `POST /customers/me/tickets/{ticketId}/refund-requests` — bkz. `frontend-icin-api-listesi.md`.

Onay → iyzico refund → bilet `Refunded`; sipariş tüm biletler iade ise `Refunded`, aksi `PartiallyRefunded`. Bildirim kuyruğu: `refund.status`.

### `GET /admin/refund-requests`

Liste. Query: `status` (opsiyonel enum adı), `take` (varsayılan 50).

### `GET /admin/refund-requests/{id}`

Tekil talep detayı.

### `POST /admin/refund-requests/{id}/approve`

```json
{
  "approvedAmount": 100.00,
  "reviewNote": "Onaylandı"
}
```

`approvedAmount` yoksa talep tutarı kullanılır. Rate limit: `payment`.

**Response `200`:** refund request DTO (`status`: `Completed` / `Failed` / …).

### `POST /admin/refund-requests/{id}/reject`

```json
{ "reviewNote": "Politika dışı" }
```

`reviewNote` zorunlu. **Response `200`:** `status` = `Rejected`.

---

## Blog (`/admin/blog`)


Bearer + AdminOnly. JSON camelCase. Status: `Draft` | `Published` | `Archived`.

### Categories (`/admin/blog/categories`)

| Method | Path | Not |
|--------|------|-----|
| GET | `/admin/blog/categories` | Tüm kategoriler (`isActive` dahil) |
| POST | `/admin/blog/categories` | Body: `name`, opsiyonel `slug`, `description`, `isActive` |
| PUT | `/admin/blog/categories/{id}` | Body: `name`, `slug?`, `description`, `isActive` |
| DELETE | `/admin/blog/categories/{id}` | Soft-delete → `204` |

### Tags (`/admin/blog/tags`)

| Method | Path | Not |
|--------|------|-----|
| GET | `/admin/blog/tags` | Tüm etiketler |
| POST | `/admin/blog/tags` | Body: `name`, opsiyonel `slug` |
| PUT | `/admin/blog/tags/{id}` | Body: `name`, `slug?` |
| DELETE | `/admin/blog/tags/{id}` | Soft-delete → `204` |

### Posts (`/admin/blog/posts`)

| Method | Path | Not |
|--------|------|-----|
| GET | `/admin/blog/posts` | Query: `categoryId`, `search`, `status`, `page`, `pageSize` |
| GET | `/admin/blog/posts/{id}` | Detay (draft dahil) |
| POST | `/admin/blog/posts` | Draft oluştur. Body: `title`, `summary`, `contentHtml`, opsiyonel `slug`, `categoryId`, `metaTitle`, `metaDescription`, `tagIds` |
| PUT | `/admin/blog/posts/{id}` | Düzenle (aynı alanlar + `tagIds` tam değiştirir) |
| PATCH | `/admin/blog/posts/{id}/publish` | Yayınla |
| PATCH | `/admin/blog/posts/{id}/unpublish` | Yayından kaldır → Draft |
| PATCH | `/admin/blog/posts/{id}/archive` | Arşivle |
| DELETE | `/admin/blog/posts/{id}` | Soft-delete → `204` |
| POST | `/admin/blog/posts/{id}/cover` | Multipart `file` — optimize (WebP) → R2 (`blog/{postId}/cover/...`) |
| DELETE | `/admin/blog/posts/{id}/cover` | Kapak sil |

**Kapak yükleme (R2):** Events ile aynı `WorkerR2Storage` akışı. Key: `StorageKeyConventions.BlogCover`.

---

## Legal (`/admin/legal`)

Sabit slug’lı yasal sayfalar (soft delete yok; unpublish). Slug seti: `kvkk`, `cerez-politikasi`, `kullanim-kosullari`, `mesafeli-satis`.

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/admin/legal` | 4 sabit slug özeti (kayıt yoksa placeholder title, `isPublished=false`) |
| GET | `/admin/legal/{slug}` | Detay; henüz kaydedilmemişse boş taslak (`id` = empty guid) |
| PUT | `/admin/legal/{slug}` | Upsert — body: `{ "title", "bodyHtml" }` |
| PATCH | `/admin/legal/{slug}/publish` | Yayınla (`publishedAtUtc` ilk seferde set) |
| PATCH | `/admin/legal/{slug}/unpublish` | Yayından kaldır (içerik kalır) |

Bilinmeyen slug → `400` (`legal_slug_unknown`).

---

## Raffles (`/admin/raffles`)

Bearer + AdminOnly. JSON camelCase. Status: `Draft` | `Scheduled` | `Open` | `Drawing` | `Completed` | `Cancelled`.

| Method | Path | Not |
|--------|------|-----|
| GET | `/admin/raffles` | Query: `status`, `search`, `page`, `pageSize` |
| GET | `/admin/raffles/{id}` | Detay + hediyeler |
| POST | `/admin/raffles` | Draft oluştur. Body: `title`, `startsAtUtc`, `endsAtUtc`, `description?` |
| PUT | `/admin/raffles/{id}` | Düzenle (başlık, açıklama, başlangıç/bitiş) — worker `endsAtUtc` kullanır |
| DELETE | `/admin/raffles/{id}` | Soft-delete → `204` (drawing/completed engelli) |
| PATCH | `/admin/raffles/{id}/schedule` | → `Scheduled` |
| PATCH | `/admin/raffles/{id}/open` | → `Open` (katılıma aç) |
| PATCH | `/admin/raffles/{id}/cancel` | → `Cancelled` |
| POST | `/admin/raffles/{id}/prizes` | Body: `name`, `quantity`, `sortOrder?`, `description?`, `imageKey?`, `imageUrl?` |
| PUT | `/admin/raffles/{id}/prizes/{prizeId}` | Hediye güncelle |
| DELETE | `/admin/raffles/{id}/prizes/{prizeId}` | Soft-delete → `204` |
| GET | `/admin/raffles/{id}/entries` | Query: `status` (`PendingOtp`/`Confirmed`/`Rejected`), `page`, `pageSize` |
| GET | `/admin/raffles/{id}/winners` | Kazananlar (hediye adı + entry bilgisi; worker §15.4 sonrası dolar) |

---

## Users (`/admin/users`)

Yalnızca `role = Customer` (guest dahil). Admin hesapları listelenmez / yönetilmez.

| Method | Path | Not |
|--------|------|-----|
| GET | `/admin/users` | Query: `search`, `status` (`Active`/`Suspended`/`Banned`), `isGuest`, `page`, `pageSize` |
| GET | `/admin/users/{id}` | Detay |
| PATCH | `/admin/users/{id}/suspend` | Body: `{ "reason": "..." }` (zorunlu, max 500). Refresh token’lar revoke |
| PATCH | `/admin/users/{id}/ban` | Body: `{ "reason": "..." }` (zorunlu). Refresh token’lar revoke |
| PATCH | `/admin/users/{id}/activate` | Aktifleştir; sebep alanları temizlenir |

Suspend/ban/activate → `admin.audit_logs` (`StatusChange`, old/new JSON: status + reason).

---

## Not

Yeni admin endpoint’ler buraya eklenir; müşteri / public API’ler `frontend-icin-api-listesi.md` dosyasında kalır.
