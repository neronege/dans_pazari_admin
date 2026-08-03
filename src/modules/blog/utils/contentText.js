/**
 * Admin writes plain text; API stores ContentHtml.
 * Converts paragraphs (blank line) and single newlines to HTML.
 */
export function plainTextToHtml(text) {
  const raw = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!raw) {
    return '';
  }

  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped
    .split(/\n\s*\n/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br />')}</p>`)
    .join('');
}

export function htmlToPlainText(html) {
  if (!html) {
    return '';
  }

  return String(html)
    .replace(/\r\n/g, '\n')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*p\s*>/gi, '\n\n')
    .replace(/<\/\s*div\s*>/gi, '\n')
    .replace(/<\/\s*h[1-6]\s*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function translationsToPlainContent(translations) {
  if (!translations || typeof translations !== 'object') {
    return translations;
  }

  const next = { ...translations };
  Object.keys(next).forEach((locale) => {
    const row = next[locale];
    if (!row) {
      return;
    }
    next[locale] = {
      ...row,
      contentHtml: htmlToPlainText(row.contentHtml)
    };
  });
  return next;
}

export function translationsToHtmlContent(translations) {
  if (!translations || typeof translations !== 'object') {
    return translations;
  }

  const next = { ...translations };
  Object.keys(next).forEach((locale) => {
    const row = next[locale];
    if (!row) {
      return;
    }
    next[locale] = {
      ...row,
      contentHtml: plainTextToHtml(row.contentHtml)
    };
  });
  return next;
}
