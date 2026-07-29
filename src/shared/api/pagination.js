export const ADMIN_DEFAULT_PAGE_SIZE = 20;
export const ADMIN_MAX_PAGE_SIZE = 100;

export function clampPage(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 1) {
    return 1;
  }

  return Math.floor(numeric);
}

export function clampPageSize(value, maxPageSize = ADMIN_MAX_PAGE_SIZE, defaultPageSize = ADMIN_DEFAULT_PAGE_SIZE) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 1) {
    return defaultPageSize;
  }

  return Math.min(Math.floor(numeric), maxPageSize);
}

export function buildPageQuery({ page = 1, pageSize = ADMIN_DEFAULT_PAGE_SIZE } = {}) {
  return {
    page: clampPage(page),
    pageSize: clampPageSize(pageSize)
  };
}

export function normalizePagedResponse(response, fallback = {}) {
  const safeItems = Array.isArray(response?.items) ? response.items : [];

  return {
    items: safeItems,
    page: clampPage(response?.page || fallback.page || 1),
    pageSize: clampPageSize(response?.pageSize || fallback.pageSize || ADMIN_DEFAULT_PAGE_SIZE),
    totalCount: Number.isFinite(Number(response?.totalCount)) ? Number(response.totalCount) : safeItems.length
  };
}
