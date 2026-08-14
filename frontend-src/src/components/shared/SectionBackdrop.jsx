import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Latar bergambar untuk sebuah seksi.
 *
 * Seluruh tampilannya datang sebagai kelas Tailwind dari seksi yang memakainya
 * — berkas mask, lubang teks, warna, opasitas, dan gerakannya. Komponen ini
 * tidak lagi merakit aturan CSS lalu menempelkannya ke atribut style; ia hanya
 * menaruh lapisannya dan, kalau diminta, mengoper posisi kursor.
 *
 * Yang masih lewat DOM hanya dua angka: --mx dan --my, posisi kursor dalam
 * piksel. Nilainya berubah puluhan kali per detik, jadi memang tidak bisa
 * jadi nama kelas. Yang membacanya tetap kelas Tailwind di sisi pemanggil.
 *
 * Keyframes sc-drift, sc-pan, dan sc-breathe hidup di styles/animations.css
 * dan ikut terbundel. Tailwind tidak bisa mendefinisikan keyframes tanpa
 * berkas konfigurasi, dan proyek ini memuat Tailwind dari CDN tanpa konfig —
 * jadi keyframes-nya di stylesheet, dan kelas [animation:...] memanggilnya.
 */

const SectionBackdrop = ({ className = '', litClassName = '', interactive = false }) => {
  const hostRef = useRef(null);

  const onPointerMove = useCallback((e) => {
    const el = hostRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, []);

  /* Pengait dipasang di window: lapisan ini sengaja pointer-transparent supaya
     tidak merebut klik dari tombol di atasnya, dan elemen semacam itu tidak
     pernah menerima pointermove sendiri. */
  useEffect(() => {
    if (!interactive) return undefined;
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [interactive, onPointerMove]);

  return (
    <span ref={hostRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className={`absolute inset-0 ${className} ${interactive ? litClassName : ''}`} />
    </span>
  );
};

export default SectionBackdrop;
