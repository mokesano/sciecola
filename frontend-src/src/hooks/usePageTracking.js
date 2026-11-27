import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

/**
 * Pencatatan kunjungan halaman nyata untuk Admin → Monitoring.
 *
 * Aplikasi memakai HashRouter, jadi server tidak tahu halaman mana yang dibuka.
 * Hook ini mengirim satu "view" ke /api/track.php setiap kali rute berubah, lalu
 * mengirim lama tampil halaman (hanya selama tab terlihat) saat pindah halaman,
 * tab disembunyikan, atau ditutup.
 *
 * - Sesi kunjungan: berakhir setelah 30 menit tanpa aktivitas (localStorage).
 * - ID pengunjung: acak, disimpan di localStorage; tidak berisi data pribadi.
 * - "Do Not Track" / Global Privacy Control dihormati: tidak ada yang dikirim.
 */

const ENDPOINT = '/api/track.php';
const IDLE_MS = 30 * 60 * 1000;
const memory = {};

const store = {
  get(k) { try { return window.localStorage.getItem(k); } catch { return memory[k] ?? null; } },
  set(k, v) { try { window.localStorage.setItem(k, v); } catch { memory[k] = v; } },
};

function randomId(len = 20) {
  const bytes = new Uint8Array(len);
  (window.crypto || {}).getRandomValues?.(bytes);
  return Array.from(bytes, (b) => (b % 36).toString(36)).join('') || String(Date.now());
}

function visitorId() {
  let v = store.get('sc_vid');
  if (!v || !/^[a-z0-9]{8,40}$/.test(v)) { v = randomId(20); store.set('sc_vid', v); }
  return v;
}

function sessionId() {
  const now = Date.now();
  let s = null;
  try { s = JSON.parse(store.get('sc_sid') || 'null'); } catch { s = null; }
  if (!s || !s.id || now - (s.last || 0) > IDLE_MS) s = { id: randomId(24) };
  s.last = now;
  store.set('sc_sid', JSON.stringify(s));
  return s.id;
}

function trackingDisabled() {
  const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
  return dnt === '1' || dnt === 'yes' || navigator.globalPrivacyControl === true;
}

function send(body, wantResponse = false) {
  try {
    const p = fetch(ENDPOINT, {
      method: 'POST',
      credentials: 'same-origin',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return wantResponse ? p.then((r) => (r.ok ? r.json() : null)).catch(() => null) : p.catch(() => null);
  } catch {
    return Promise.resolve(null);
  }
}

function readUtm(search) {
  const q = new URLSearchParams(search || '');
  const utm = { source: q.get('utm_source'), medium: q.get('utm_medium'), campaign: q.get('utm_campaign') };
  return utm.source || utm.medium || utm.campaign ? utm : null;
}

export default function usePageTracking() {
  const location = useLocation();
  const current = useRef(null);       // { id (Promise<number|null>), sid, visibleMs, since }
  const firstView = useRef(true);

  // Selesaikan halaman yang sedang tampil: kirim lama tampil (detik).
  const flush = (final) => {
    const c = current.current;
    if (!c) return;
    if (c.since !== null) { c.visibleMs += Date.now() - c.since; c.since = final ? null : Date.now(); }
    const seconds = Math.round(c.visibleMs / 1000);
    c.id.then((id) => { if (id) send({ t: 'leave', id, sid: c.sid, s: seconds }); });
  };

  useEffect(() => {
    if (trackingDisabled()) return undefined;

    flush(true);
    const sid = sessionId();
    const body = { t: 'view', path: location.pathname || '/', sid, vid: visitorId() };
    if (firstView.current) {
      firstView.current = false;
      try {
        const ref = document.referrer;
        if (ref && new URL(ref).host !== window.location.host) body.ref = ref;
      } catch { /* referrer tidak valid */ }
      const utm = readUtm(window.location.search) || readUtm(location.search);
      if (utm) body.utm = utm;
    }
    current.current = {
      id: send(body, true).then((r) => (r && r.id ? r.id : null)),
      sid,
      visibleMs: 0,
      since: document.visibilityState === 'visible' ? Date.now() : null,
    };
    return undefined;
    // flush sengaja tidak menjadi dependensi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (trackingDisabled()) return undefined;
    const onVisibility = () => {
      const c = current.current;
      if (!c) return;
      if (document.visibilityState === 'hidden') {
        flush(true);                       // simpan durasi sementara
      } else if (c.since === null) {
        c.since = Date.now();              // lanjutkan hitungan
        sessionId();                       // perpanjang sesi
      }
    };
    const onHide = () => flush(true);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Komponen kosong untuk dipasang di dalam <Router>. */
export function PageTracker() {
  usePageTracking();
  return null;
}
