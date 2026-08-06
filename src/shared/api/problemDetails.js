function pickErrorCode(problem) {
  if (problem?.errorCode) {
    return problem.errorCode;
  }

  if (problem?.extensions?.errorCode) {
    return problem.extensions.errorCode;
  }

  return null;
}

function pickValidationErrors(problem) {
  if (problem?.errors) {
    return problem.errors;
  }

  if (problem?.extensions?.errors) {
    return problem.extensions.errors;
  }

  return null;
}

function normalizeFieldKey(value) {
  return String(value || '')
    .trim()
    .replace(/\[(\w+)\]/g, '.$1')
    .replace(/^\.+|\.+$/g, '')
    .toLowerCase();
}

function pickFirstValidationMessage(value) {
  if (Array.isArray(value)) {
    return value.find(Boolean) ? String(value.find(Boolean)) : '';
  }

  return value ? String(value) : '';
}

function keyMatchesAlias(problemKey, alias) {
  if (!problemKey || !alias) {
    return false;
  }

  return problemKey === alias || problemKey.endsWith(`.${alias}`);
}

export function toProblemDetails(status, payload, fallbackMessage = 'Beklenmeyen bir hata olustu.') {
  const isObjectPayload = payload && typeof payload === 'object';

  const problem = {
    status: Number.isFinite(status) ? status : payload?.status || 500,
    title: isObjectPayload && payload.title ? payload.title : 'Islem basarisiz.',
    detail: isObjectPayload && payload.detail ? payload.detail : fallbackMessage,
    instance: isObjectPayload ? payload.instance || null : null,
    errorCode: isObjectPayload ? pickErrorCode(payload) : null,
    errors: isObjectPayload ? pickValidationErrors(payload) : null,
    raw: payload || null
  };

  return problem;
}

export function isProblemDetails(value) {
  return Boolean(value) && typeof value === 'object' && 'title' in value && 'status' in value;
}

export function getHumanReadableError(problem) {
  if (!problem) {
    return 'Islem basarisiz.';
  }

  const validationErrors = problem.errors;
  if (validationErrors && typeof validationErrors === 'object') {
    const messages = Object.values(validationErrors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter(Boolean)
      .map(String);

    if (messages.length > 0) {
      return messages.join(' ');
    }
  }

  if (problem.detail && problem.detail !== 'Beklenmeyen bir hata olustu.') {
    return problem.detail;
  }

  if (problem.title) {
    return problem.title;
  }

  if (problem.detail) {
    return problem.detail;
  }

  return 'Islem basarisiz.';
}

export function getProblemFieldErrors(problem, aliasesByField = {}) {
  const validationErrors = problem?.errors;
  if (!validationErrors || typeof validationErrors !== 'object') {
    return {};
  }

  const normalizedProblemEntries = Object.entries(validationErrors).map(([key, value]) => [normalizeFieldKey(key), value]);
  const result = {};

  Object.entries(aliasesByField).forEach(([fieldName, aliases]) => {
    const normalizedAliases = [fieldName, ...(Array.isArray(aliases) ? aliases : [aliases])]
      .map(normalizeFieldKey)
      .filter(Boolean);

    const match = normalizedProblemEntries.find(([problemKey]) => normalizedAliases.some((alias) => keyMatchesAlias(problemKey, alias)));
    if (!match) {
      return;
    }

    const message = pickFirstValidationMessage(match[1]);
    if (message) {
      result[fieldName] = message;
    }
  });

  return result;
}

export function getRequestErrorMessage(error, fallback = 'Islem basarisiz.') {
  return getHumanReadableError(error?.problem) || error?.message || fallback;
}

