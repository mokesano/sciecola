import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Latar bergambar untuk sebuah seksi.
 *
 * Tiga hal yang dikerjakan komponen ini:
 *
 * 1. SVG dipasang sebagai CSS mask, bukan sebagai <img>. Sebagai mask, satu
 *    berkas bisa diisi warna apa pun, jadi artwork yang sama bisa tampil di
 *    atas bidang putih maupun bidang gelap tanpa menyimpan salinan berwarna.
 *
 * 2. Lapisan mask kedua melubangi bagian tengah. Ini bukan sekadar menurunkan
 *    opasitas seluruh gambar — gambarnya benar-benar tidak digambar di kolom
 *    tempat teks berada, lalu menguat ke arah tepi. Teks selalu duduk di atas
 *    bidang bersih, berapa pun terangnya artwork di pinggir.
 *
 * 3. Gerakannya lambat dan tidak berulang persis. Aturannya hidup di
 *    styles/animations.css dan ikut terbundel; komponen ini hanya mengoper
 *    nilai yang memang berubah per seksi lewat custom property.
 */

const MOTION = {
  drift:   'sc-drift 34s ease-in-out infinite alternate',
  pan:     'sc-pan 46s ease-in-out infinite alternate',
  breathe: 'sc-breathe 22s ease-in-out infinite alternate',
  none:    'none',
};

/*
 * Lubang tempat teks duduk. Transparan di tengah — di situ artwork tidak
 * digambar — lalu menguat penuh ke tepi. `reach` mengatur seberapa lebar
 * lubangnya: seksi yang teksnya melebar butuh lubang lebih besar.
 */
const clearing = (reach) =>
  `radial-gradient(ellipse ${reach}% ${Math.round(reach * 0.82)}% at 50% 50%,` +
  ' rgba(0,0,0,0) 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.35) 58%, #000 82%)';

const SectionBackdrop = ({
  src,
  color   = '#EA580C',
  opacity = 0.28,
  motion  = 'drift',
  reach   = 74,        // lebar lubang teks, dalam persen lebar seksi
  position = 'center',
  size     = 'cover',
  interactive = false, // gambarnya menyala mengikuti kursor
  litColor = 'rgba(234,88,12,0.85)',
  litRadius = 320,
}) => {
  /* Posisi pointer ditulis ke custom property lewat ref, bukan lewat state.
     Menyimpannya di state akan memicu render ulang puluhan kali per detik
     untuk sesuatu yang tidak mengubah struktur apa pun. */
  const hostRef = useRef(null);
  const onPointerMove = useCallback((e) => {
    const el = hostRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, []);

  /* Pengait dipasang di elemen seksi, sementara lapisan latarnya sendiri
     tetap pointer-transparent — kalau tidak, ia akan merebut klik dari tombol
     dan tautan yang ada di atasnya. */
  useEffect(() => {
    if (!interactive) return undefined;
    const section = hostRef.current?.parentElement;
    if (!section) return undefined;
    section.addEventListener('pointermove', onPointerMove);
    return () => section.removeEventListener('pointermove', onPointerMove);
  }, [interactive, onPointerMove]);

  if (!src) return null;

  /* Hanya nilai yang benar-benar berbeda per seksi yang dioper ke DOM.
     Aturan mask, animasi, dan reduced-motion hidup di berkas CSS. */
  const vars = {
    '--sc-mask':      `url('${src}'), ${clearing(reach)}`,
    '--sc-mask-size': `${size}, cover`,
    '--sc-mask-pos':  `${position}, center`,
    '--sc-color':     color,
    '--sc-opacity':   opacity,
    '--sc-motion':    MOTION[motion] ?? MOTION.drift,
    '--sc-lit-color': litColor,
    '--sc-lit-radius': `${litRadius}px`,
  };

  return (
    <span ref={hostRef} aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden" style={vars}>
      <span className="sc-layer sc-layer--art" />
      {interactive && <span className="sc-layer sc-layer--lit" />}
    </span>
  );
};

export default SectionBackdrop;
