export function getScanResultMeta(resultCode) {
  const code = String(resultCode || '').toLowerCase();

  if (code === 'valid') {
    return { label: 'Geçerli', color: 'success', tone: 'success' };
  }

  if (code === 'already_used') {
    return { label: 'Daha önce kullanılmış', color: 'warning', tone: 'warning' };
  }

  if (code === 'wrong_event') {
    return { label: 'Yanlış etkinlik', color: 'error', tone: 'error' };
  }

  if (code === 'wrong_session') {
    return { label: 'Yanlış seans', color: 'error', tone: 'error' };
  }

  if (code === 'cancelled' || code === 'refunded' || code === 'not_active') {
    return { label: 'Geçersiz durum', color: 'warning', tone: 'warning' };
  }

  if (code === 'not_found') {
    return { label: 'Bulunamadı', color: 'error', tone: 'error' };
  }

  if (code === 'invalid') {
    return { label: 'Format geçersiz', color: 'error', tone: 'error' };
  }

  return { label: 'Bilinmiyor', color: 'default', tone: 'info' };
}

export function playScanFeedback(isSuccessful) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return;
    }
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = isSuccessful ? 880 : 220;
    gain.gain.value = 0.08;
    osc.start();
    osc.stop(ctx.currentTime + (isSuccessful ? 0.12 : 0.28));
  } catch {
    // Ses zorunlu değil.
  }
}
