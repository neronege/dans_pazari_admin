export function getFieldError(errors, key) {
  return errors[key] || '';
}

export function clearFieldError(errors, key) {
  if (!errors[key]) {
    return errors;
  }

  const next = { ...errors };
  delete next[key];
  return next;
}

export function withFieldError(errorText, helperText = '') {
  return errorText || helperText || '';
}

export function getLocaleTabFromFieldErrors(errors) {
  const key = Object.keys(errors || {}).find((fieldKey) => /^translations\.(tr|en|ru)\./.test(fieldKey));
  if (!key) {
    return '';
  }

  return key.split('.')[1] || '';
}