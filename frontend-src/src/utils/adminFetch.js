/**
 * adminFetch — fetch() untuk endpoint admin.
 *
 * Menambahkan header X-Admin-Token dari token yang dimasukkan di Admin → Cache & DB
 * (disimpan di sessionStorage tab ini). Server memverifikasinya terhadap
 * ADMIN_TOOL_TOKEN di .env (src/Auth/AdminGuard.php).
 *
 * PUT/DELETE diblokir oleh .htaccess, jadi dikirim sebagai POST dengan header
 * X-HTTP-Method-Override; server membacanya lewat AdminGuard::method().
 */
export const ADMIN_TOKEN_KEY = 'sciecola_admin_token';

export function getAdminToken() {
  try { return sessionStorage.getItem(ADMIN_TOKEN_KEY) || ''; } catch { return ''; }
}

export function adminFetch(url, options = {}) {
  const method  = (options.method || 'GET').toUpperCase();
  const headers = { ...(options.headers || {}), 'X-Admin-Token': getAdminToken() };
  let realMethod = method;
  if (method === 'PUT' || method === 'DELETE' || method === 'PATCH') {
    headers['X-HTTP-Method-Override'] = method;
    realMethod = 'POST';
  }
  return fetch(url, { ...options, method: realMethod, headers });
}

export default adminFetch;
