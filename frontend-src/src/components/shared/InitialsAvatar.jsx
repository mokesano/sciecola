import { useState } from 'react';

/**
 * Avatar peneliti/pengguna.
 * - Bila ada foto asli (src), tampilkan foto itu.
 * - Bila tidak ada / gagal dimuat, tampilkan inisial nama secara lokal.
 * Tidak memakai layanan pihak ketiga (pravatar/ui-avatars) agar tidak
 * menampilkan wajah orang lain dan tidak mengirim nama ke server luar.
 */
const PALETTE = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#2563eb'];

export function initialsOf(name = '') {
  const clean = String(name)
    .replace(/\b(prof|dr|ir|drs|dra|h|hj)\.?\s+/gi, '')
    .replace(/,.*$/, '')
    .trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function colorOf(seed = '') {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export default function InitialsAvatar({ src, name = '', seed, className = '', textClassName = 'text-lg', alt }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt || name}
        className={`${className} object-cover`}
        onError={() => setFailed(true)}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={alt || name}
      className={`${className} flex items-center justify-center font-bold text-white select-none`}
      style={{ backgroundColor: colorOf(seed || name) }}
    >
      <span className={textClassName}>{initialsOf(name)}</span>
    </div>
  );
}
