# Admin i18n — içerik çeviri UI (Faz D)

Backend `translations[]` + `?lang=` hazırdı. Bu turda **admin formlarına** TR / EN / RU sekmeleri eklendi.

## Ortak
- `src/shared/i18n/contentLocales.js` — hydrate / payload / slug
- `src/shared/i18n/TranslationLocaleTabs.jsx` — MUI Tabs

**Kurallar:** TR zorunlu · EN/RU opsiyonel · eksik locale silinmez · root flat alanlar = TR mirror

## Ekranlar
| Modül | Dosya | Not |
|-------|--------|-----|
| Kategori | `modules/categories/pages/CategoriesPage.jsx` | name/slug/description |
| Etkinlik | `modules/events/pages/EventsPage.jsx` | title/slug/description/meta… |
| Mekan | `modules/venues/pages/VenuesPage.jsx` | multipart + `translations` JSON string; city çevrilmez |
| Blog yazı | `modules/blog/pages/BlogPostsPage.jsx` | title/summary/contentHtml/meta… |
| Yasal | `modules/legal/` (yeni) | slug sabit; title/bodyHtml |

Menü: **İçerik → Yasal Sayfalar** (`/legal`)

## Bilinçli dışı
- next-intl / admin chrome string i18n
- Blog kategori/etiket CRUD UI (select listeleri yeterli; backend hazır)
- Public site
