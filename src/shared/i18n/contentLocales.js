export const CONTENT_LOCALES = [
  { code: 'tr', label: 'TR', required: true },
  { code: 'en', label: 'EN', required: false },
  { code: 'ru', label: 'RU', required: false }
];

export function toContentSlug(value) {
  const raw = String(value || '')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  // Kiril vb. başlıklarda latin slug üretilemezse boş bırak;
  // backend title'dan slug üretir.
  return raw;
}

/** Boş TR/EN/RU alan haritası. `fields` örn. `{ name: '', slug: '', description: '' }` */
export function createEmptyTranslations(fields) {
  return CONTENT_LOCALES.reduce((acc, locale) => {
    acc[locale.code] = { ...fields };
    return acc;
  }, {});
}

/**
 * API `translations[]` + root mirror alanlarından locale map üretir.
 * @param {Array} apiTranslations
 * @param {Record<string, string>} emptyFields
 * @param {Record<string, unknown>} rootFallback — root TR mirror (name/title…)
 */
export function hydrateTranslations(apiTranslations, emptyFields, rootFallback = {}) {
  const map = createEmptyTranslations(emptyFields);
  const fieldKeys = Object.keys(emptyFields);

  for (const key of fieldKeys) {
    if (rootFallback[key] != null && rootFallback[key] !== '') {
      map.tr[key] = rootFallback[key];
    }
  }

  for (const row of apiTranslations || []) {
    const locale = String(row?.locale || '').trim().toLowerCase();
    if (!map[locale]) {
      continue;
    }

    for (const key of fieldKeys) {
      if (row[key] != null) {
        map[locale][key] = row[key];
      }
    }
  }

  return map;
}

/**
 * Backend'e gidecek translations[] üretir.
 * TR her zaman (primary doluysa) eklenir; EN/RU yalnızca en az bir alan doluysa.
 * @param {string} primaryField — zorunlu alan (name | title)
 */
export function buildTranslationsPayload(translations, fieldKeys, primaryField) {
  const result = [];

  for (const { code } of CONTENT_LOCALES) {
    const row = translations?.[code] || {};
    const primary = String(row[primaryField] ?? '').trim();
    const hasAnyContent = fieldKeys.some((key) => String(row[key] ?? '').trim() !== '');

    if (code === 'tr') {
      if (!primary) {
        continue;
      }
    } else if (!hasAnyContent) {
      continue;
    }

    const item = { locale: code };
    for (const key of fieldKeys) {
      const value = row[key];
      if (value === null || value === undefined) {
        item[key] = null;
      } else if (typeof value === 'string') {
        const trimmed = value.trim();
        item[key] = trimmed === '' ? null : trimmed;
      } else {
        item[key] = value;
      }
    }

    // primary boş string olmasın
    if (item[primaryField] == null || item[primaryField] === '') {
      if (code === 'tr') {
        continue;
      }
      // opsiyonel dilde primary yoksa satırı atla
      continue;
    }

    result.push(item);
  }

  return result;
}

/** TR satırını root mirror alanlarına kopyala (geriye uyumluluk). */
export function trAsRoot(translations, fieldMap) {
  const tr = translations?.tr || {};
  const root = {};
  for (const [rootKey, localeKey] of Object.entries(fieldMap)) {
    const value = tr[localeKey];
    root[rootKey] = value == null || value === '' ? null : value;
  }
  return root;
}

export function updateLocaleField(translations, locale, field, value, { autoSlugFrom } = {}) {
  const nextLocale = {
    ...(translations[locale] || {}),
    [field]: value
  };

  if (autoSlugFrom && field === autoSlugFrom) {
    nextLocale.slug = toContentSlug(value);
  }

  return {
    ...translations,
    [locale]: nextLocale
  };
}
