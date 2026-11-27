/**
 * Pembayaran online (Midtrans / Xendit) dari sisi browser.
 *
 * startPayment() membuat transaksi di server lalu mengarahkan pengguna ke halaman bayar
 * gateway. Nomor order disimpan di sessionStorage supaya saat pengguna kembali, halaman
 * dapat menanyakan statusnya (checkReturnedPayment) — server menyinkronkannya ke gateway,
 * jadi status tetap benar walaupun webhook belum sampai.
 */

const KEY = 'sciecola_pending_payment';

export const GATEWAY_LABEL = { midtrans: 'Midtrans', xendit: 'Xendit' };

export async function startPayment(body) {
  const res = await fetch('/api/payments.php', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', return_url: window.location.href, ...body }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok || d.status !== 'success' || !d.checkout_url) throw new Error(d.message || `HTTP ${res.status}`);
  try { sessionStorage.setItem(KEY, JSON.stringify({ order_id: d.order_id, purpose: body.purpose, at: Date.now() })); } catch { /* mode privat */ }
  window.location.assign(d.checkout_url);
  return d;
}

/**
 * Bila ada pembayaran yang baru saja dimulai (≤ 6 jam), tanyakan statusnya.
 * @returns {Promise<null | {order_id, status, purpose, ref_id, ...}>}
 */
export async function checkReturnedPayment(purpose) {
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { saved = null; }
  if (!saved || (purpose && saved.purpose !== purpose) || Date.now() - saved.at > 6 * 3600 * 1000) return null;
  try {
    const res = await fetch(`/api/payments.php?action=status&order_id=${encodeURIComponent(saved.order_id)}`, { credentials: 'same-origin' });
    const d = await res.json();
    if (d.status !== 'success') return null;
    if (d.payment.status !== 'pending') sessionStorage.removeItem(KEY);
    return d.payment;
  } catch {
    return null;
  }
}

export function formatMoney(amount, currency = 'IDR', locale = 'id-ID') {
  if (amount === null || amount === undefined) return '—';
  try { return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount); }
  catch { return `${currency} ${Number(amount).toLocaleString(locale)}`; }
}
