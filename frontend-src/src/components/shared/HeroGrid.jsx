import React, { useEffect, useRef } from 'react';

/**
 * Kisi titik untuk hero.
 *
 * Sebelumnya kisi ini datang dari sebuah berkas SVG yang dipasang sebagai
 * mask. Titiknya sudah tergambar di dalam berkas itu — jumlahnya sedikit dan
 * letaknya tetap — jadi yang bisa menyala hanya titik yang kebetulan ada.
 * Di sini polanya dibuat CSS: garis dan titik lahir dari gradien berulang,
 * sehingga setiap perpotongan garis punya titiknya sendiri, serapat apa pun
 * jaraknya diatur.
 *
 * Dua lapisan menumpuk. Lapisan dasar menggambar kisinya. Lapisan kedua
 * menggambar kisi yang sama dengan titik sedikit lebih besar dan warna lebih
 * pekat, lalu dipotong oleh sorotan bundar di posisi kursor — jadi yang
 * terlihat bukan lingkaran cahaya di atas kisi, melainkan titik-titik kisi
 * itu sendiri yang membesar dan menguat saat kursor lewat.
 *
 * Posisi sorotan tidak ditulis langsung dari event. Setiap event hanya
 * memperbarui sasaran; nilai yang dipakai dikejar ke arah sasaran itu satu
 * langkah per frame di dalam requestAnimationFrame. Itu yang membuat
 * gerakannya terasa mengalir, bukan mematah mengikuti laju event, dan
 * kerjanya berhenti sendiri begitu sorotan sampai di sasaran.
 */

const HeroGrid = ({
  gap = 26,                        // jarak antar garis, sekaligus jarak antar titik
  line  = 'rgba(234,88,12,0.10)',
  dot   = 'rgba(234,88,12,0.34)',
  glow  = 'rgba(194,65,12,0.95)',
  radius = 230,                    // jangkauan sorotan
  className = '',
}) => {
  const hostRef   = useRef(null);
  const targetRef = useRef({ x: -9999, y: -9999 });
  const posRef    = useRef({ x: -9999, y: -9999 });
  const rafRef    = useRef(0);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    const step = () => {
      const p = posRef.current;
      const t = targetRef.current;

      /* Lompatan pertama tidak perlu dianimasikan: sorotan belum ada di mana
         pun, jadi mengejar dari luar layar hanya menghasilkan sapuan aneh. */
      if (p.x < -9000) { p.x = t.x; p.y = t.y; }

      p.x += (t.x - p.x) * 0.18;
      p.y += (t.y - p.y) * 0.18;
      el.style.setProperty('--gx', `${p.x.toFixed(1)}px`);
      el.style.setProperty('--gy', `${p.y.toFixed(1)}px`);

      const settled = Math.abs(t.x - p.x) < 0.4 && Math.abs(t.y - p.y) < 0.4;
      rafRef.current = settled ? 0 : requestAnimationFrame(step);
    };

    /* Pengait dipasang di window: lapisan ini sengaja pointer-transparent
       supaya tidak merebut klik dari tombol hero di atasnya, dan elemen
       semacam itu tidak pernah menerima pointermove sendiri. */
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      targetRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (!rafRef.current) rafRef.current = requestAnimationFrame(step);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, []);

  const vars = {
    '--sc-gap':    `${gap}px`,
    '--sc-half':   `${gap / 2}px`,
    '--sc-line':   line,
    '--sc-dot':    dot,
    '--sc-glow':   glow,
    '--sc-radius': `${radius}px`,
  };

  return (
    <span ref={hostRef} aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} style={vars}>
      <span className="sc-grid" />
      <span className="sc-grid sc-grid--glow" />
    </span>
  );
};

export default HeroGrid;
