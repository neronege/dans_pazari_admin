const STORAGE_KEY = 'danspazari.gate.context';

/**
 * @typedef {{ eventId: string, eventTitle: string, sessionId: string | null, sessionLabel: string | null }} GateContext
 */

/** @returns {GateContext | null} */
export function loadGateContext() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed?.eventId) {
      return null;
    }
    return {
      eventId: String(parsed.eventId),
      eventTitle: String(parsed.eventTitle || ''),
      sessionId: parsed.sessionId ? String(parsed.sessionId) : null,
      sessionLabel: parsed.sessionLabel ? String(parsed.sessionLabel) : null
    };
  } catch {
    return null;
  }
}

/** @param {GateContext} context */
export function saveGateContext(context) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
}

export function clearGateContext() {
  window.localStorage.removeItem(STORAGE_KEY);
}
