import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Latar bergambar untuk sebuah seksi.
 *
 * Tampilannya hidup di styles/homepage.css sebagai kelas bernama; komponen
 * ini hanya menaruh lapisannya dan, kalau diminta, mengoper posisi kursor.
 * Yang lewat DOM cuma dua angka — --mx dan --my — karena nilainya berubah
 * puluhan kali per detik dan memang tidak bisa jadi nama kelas.
 */

const SectionBackdrop = ({ art, hole, tone, strength, motion, lit, interactive = false }) => {
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

  const layer = [
    'sc-backdrop__layer',
    `sc-backdrop__layer_${art}`,
    `sc-backdrop__layer_hole${hole}`,
    `sc-backdrop__layer_tone-${tone}`,
    `sc-backdrop__layer_${strength}`,
    `sc-backdrop__layer_${motion}`,
    interactive ? 'sc-backdrop__layer_lit' : '',
    interactive && lit ? `sc-backdrop__layer_lit-${lit}` : '',
  ].filter(Boolean).join(' ');

  return (
    <span ref={hostRef} aria-hidden className="sc-backdrop">
      <span className={layer} />
    </span>
  );
};

export default SectionBackdrop;
