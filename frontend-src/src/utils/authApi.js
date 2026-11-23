/**
 * authApi — pemanggil /api/auth.php.
 *
 * Sesi dibawa cookie HttpOnly yang dipasang server, jadi tidak ada token yang
 * disimpan di localStorage. Setiap fetch ke /api/* dari situs yang sama otomatis
 * membawa cookie tersebut.
 */
const ENDPOINT = '/api/auth.php';

export class AuthError extends Error {
  constructor(message, { status, code, field, data } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.field = field;
    this.data = data;
  }
}

async function parse(res) {
  let data = null;
  try { data = await res.json(); } catch { /* respons bukan JSON */ }
  if (!res.ok || !data || data.status === 'error') {
    throw new AuthError(data?.message || `HTTP ${res.status}`, {
      status: res.status, code: data?.code, field: data?.field, data,
    });
  }
  return data;
}

export async function authPost(action, body = {}) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  });
  return parse(res);
}

export async function authGet(action, params = {}) {
  const qs = new URLSearchParams({ action, ...params });
  const res = await fetch(`${ENDPOINT}?${qs}`, { credentials: 'same-origin' });
  return parse(res);
}

let configPromise = null;
/** Pengaturan publik: kunci Turnstile, penyedia OAuth yang aktif, dll. (di-cache). */
export function getAuthConfig() {
  if (!configPromise) {
    configPromise = authGet('config').catch(() => ({
      turnstile_site_key: null, oauth: { orcid: false, google: false },
      require_email_verification: true, password_min_length: 8,
    }));
  }
  return configPromise;
}

/** URL untuk memulai login/penautan lewat ORCID atau Google. */
export function oauthUrl(provider, { mode = 'login', next = '', remember = false } = {}) {
  const qs = new URLSearchParams({ action: 'oauth_start', provider, mode });
  if (next) qs.set('next', next);
  if (remember) qs.set('remember', '1');
  return `${ENDPOINT}?${qs}`;
}
