import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Mencatat aktivitas pengguna yang login ke /api/my_activity.php
 * (sumber data halaman "Aktivitas Saya", "Log History", dan dashboard).
 * Hanya untuk akun dengan ORCID; kegagalan diabaikan agar tidak mengganggu halaman.
 */
export function trackActivity({ type, category, targetId, title, metadata } = {}) {
  if (!type || !targetId) return;
  try {
    fetch('/api/my_activity.php', {
      method: 'POST',
      credentials: 'same-origin',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        category,
        target_id: String(targetId).slice(0, 512),
        title: title ? String(title).slice(0, 300) : '',
        metadata: metadata || {},
      }),
    }).catch(() => {});
  } catch {
    /* abaikan */
  }
}

/** Catat satu kali "dilihat" untuk halaman profil saat datanya sudah termuat. */
export function useTrackView(category, targetId, title, metadata) {
  const { user } = useAuth();
  const sent = useRef('');
  const orcid = user?.orcid;
  useEffect(() => {
    if (!orcid || !targetId || !title) return;
    const key = `${category}:${targetId}`;
    if (sent.current === key) return;
    sent.current = key;
    trackActivity({ type: 'viewed', category, targetId, title, metadata });
    // metadata sengaja tidak menjadi dependensi (objek baru tiap render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orcid, category, targetId, title]);
}

export default useTrackView;
