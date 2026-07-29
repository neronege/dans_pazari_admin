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

  if (problem.detail) {
    return problem.detail;
  }

  if (problem.title) {
    return problem.title;
  }

  return 'Islem basarisiz.';
}
