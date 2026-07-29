import { getAccessToken } from './authToken';
import { toProblemDetails } from './problemDetails';

const DEFAULT_TIMEOUT_MS = 20000;
const CORRELATION_HEADER = 'X-Correlation-ID';

function createCorrelationId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const random = Math.random().toString(36).slice(2);
  return `corr-${Date.now()}-${random}`;
}

function getApiBaseUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL;
  return fromEnv ? fromEnv.replace(/\/$/, '') : '';
}

function buildQueryString(params) {
  if (!params || typeof params !== 'object') {
    return '';
  }

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== null && item !== undefined && item !== '') {
          searchParams.append(key, String(item));
        }
      });
      return;
    }

    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function toAbsoluteUrl(path, params) {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}${buildQueryString(params)}`;
}

function mergeAbortSignals(externalSignal, internalController) {
  if (!externalSignal) {
    return internalController.signal;
  }

  if (externalSignal.aborted) {
    internalController.abort();
    return internalController.signal;
  }

  externalSignal.addEventListener('abort', () => internalController.abort(), { once: true });
  return internalController.signal;
}

async function parseBody(response, responseType) {
  if (response.status === 204) {
    return null;
  }

  if (responseType === 'blob') {
    return response.blob();
  }

  if (responseType === 'text') {
    return response.text();
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

export class HttpError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = details?.status || 0;
    this.problem = details?.problem || null;
    this.correlationId = details?.correlationId || null;
  }
}

export async function request(path, options = {}) {
  const {
    method = 'GET',
    params,
    body,
    headers = {},
    token,
    responseType = 'json',
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
    skipAuth = false
  } = options;

  const correlationId = createCorrelationId();
  const controller = new AbortController();
  const mergedSignal = mergeAbortSignals(signal, controller);

  const timeoutHandle = setTimeout(() => {
    controller.abort('Request timeout');
  }, timeoutMs);

  const authToken = token || (skipAuth ? null : getAccessToken());

  const requestHeaders = {
    Accept: 'application/json',
    [CORRELATION_HEADER]: correlationId,
    ...headers
  };

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isFormData) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (authToken) {
    requestHeaders.Authorization = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(toAbsoluteUrl(path, params), {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      signal: mergedSignal
    });

    const payload = await parseBody(response, responseType);

    if (!response.ok) {
      const problem = toProblemDetails(response.status, payload);
      throw new HttpError(problem.detail || problem.title || 'API istegi basarisiz.', {
        status: response.status,
        problem,
        correlationId
      });
    }

    return {
      data: payload,
      status: response.status,
      headers: response.headers,
      correlationId
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    if (error?.name === 'AbortError') {
      throw new HttpError('Istek zaman asimina ugradi veya iptal edildi.', {
        status: 0,
        problem: toProblemDetails(0, null, 'Istek zaman asimina ugradi veya iptal edildi.'),
        correlationId
      });
    }

    throw new HttpError('Ag hatasi olustu.', {
      status: 0,
      problem: toProblemDetails(0, null, 'Ag hatasi olustu.'),
      correlationId
    });
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export const httpClient = {
  get: (path, options = {}) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options = {}) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options = {}) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options = {}) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options = {}) => request(path, { ...options, method: 'DELETE' })
};
