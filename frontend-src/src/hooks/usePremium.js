import { useEffect, useState } from 'react';

/**
 * Status layanan premium dari /api/premium.php?action=status.
 * Satu permintaan dibagi oleh semua komponen (cache modul); panggil refreshPremium()
 * setelah admin mengubah saklar atau setelah masuk/keluar.
 *
 * Bila gagal dimuat, layanan dianggap gratis (enabled=false) agar tidak memblokir pengguna.
 */

const FREE = { enabled: false, features: {}, tiers: {}, me: null, contact_email: '', pricing_note: '', loaded: true };
let cache = null;
let inflight = null;
const listeners = new Set();

function load() {
  if (!inflight) {
    inflight = fetch('/api/premium.php?action=status', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => (d && d.status === 'success' ? { ...FREE, ...d, loaded: true } : FREE))
      .catch(() => FREE)
      .then((d) => { cache = d; inflight = null; listeners.forEach((fn) => fn(d)); return d; });
  }
  return inflight;
}

export function refreshPremium() {
  cache = null;
  return load();
}

export function usePremium() {
  const [state, setState] = useState(cache || { ...FREE, loaded: false });
  useEffect(() => {
    listeners.add(setState);
    if (cache) setState(cache); else load();
    return () => { listeners.delete(setState); };
  }, []);
  return state;
}

/** Lencana keanggotaan untuk satu ORCID (null bila premium mati / bukan anggota). */
export function usePremiumTier(orcid) {
  const [tier, setTier] = useState(null);
  useEffect(() => {
    setTier(null);
    if (!orcid || !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(orcid)) return undefined;
    let alive = true;
    fetch(`/api/premium.php?action=tier&orcid=${encodeURIComponent(orcid)}`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => { if (alive && d.status === 'success') setTier(d.tier || null); })
      .catch(() => {});
    return () => { alive = false; };
  }, [orcid]);
  return tier;
}

/** Cek akses satu fitur (mis. laporan institusi untuk ID tertentu). */
export async function checkPremiumAccess(feature, params = {}) {
  try {
    const qs = new URLSearchParams({ action: 'access', feature, ...params }).toString();
    const r = await fetch(`/api/premium.php?${qs}`, { credentials: 'same-origin' });
    const d = await r.json();
    return d.status === 'success' ? d : { allowed: true, premium: false };
  } catch {
    return { allowed: true, premium: false };
  }
}

/** Unduh baris (array of arrays) sebagai CSV UTF-8 yang terbaca Excel. */
export function downloadCsv(filename, rows) {
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default usePremium;
