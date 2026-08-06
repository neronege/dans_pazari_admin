/**
 * Admin form alanları için DB varchar limitleri ve MUI TextField props.
 */

export const FIELD_LIMITS = {
  venue: {
    name: 200,
    slug: 220,
    city: 100,
    district: 100,
    videoUrl: 1000
  },
  blogPost: {
    title: 250,
    slug: 280,
    summary: 500,
    metaTitle: 200,
    metaDescription: 400
  },
  blogCategory: {
    name: 150,
    slug: 180
  },
  blogTag: {
    name: 100,
    slug: 120
  },
  faq: {
    question: 500
  },
  event: {
    title: 250,
    slug: 280,
    shortDescription: 2000,
    metaTitle: 200,
    metaDescription: 400,
    videoUrl: 1000,
    organizerFirstName: 100,
    organizerLastName: 100
  }
};

export function charLength(value) {
  return String(value ?? '').length;
}

export function isOverLimit(value, max) {
  return charLength(value) > max;
}

/**
 * @param {string|null|undefined} value
 * @param {number} max
 * @param {string} [extraHelper]
 * @param {{ hardMax?: boolean }} [options] hardMax=true ise tarayıcı maxLength uygular
 */
export function lengthFieldProps(value, max, extraHelper = '', options = {}) {
  const { hardMax = false } = options;
  const length = charLength(value);
  const over = length > max;
  const counter = `${length}/${max}`;
  const base = extraHelper ? `${extraHelper} · ${counter}` : counter;

  return {
    error: over,
    helperText: over ? `En fazla ${max} karakter olabilir. (${counter})` : base,
    ...(hardMax ? { inputProps: { maxLength: max } } : {})
  };
}

/**
 * Çeviri satırlarında birden fazla alan için aşım kontrolü.
 * @param {Record<string, string>|null|undefined} row
 * @param {Record<string, number>} limits
 */
export function rowHasLengthErrors(row, limits) {
  if (!row || !limits) return false;
  return Object.entries(limits).some(([key, max]) => isOverLimit(row[key], max));
}

/**
 * Tüm locale satırlarında aşım var mı?
 * @param {Record<string, Record<string, string>>|null|undefined} translations
 * @param {Record<string, number>} limits
 */
export function translationsHaveLengthErrors(translations, limits) {
  if (!translations) return false;
  return Object.values(translations).some((row) => rowHasLengthErrors(row, limits));
}
