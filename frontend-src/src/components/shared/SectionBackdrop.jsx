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

  /* Pengait dipasang di window, bukan di elemen induk. Lapisan latar ini —
     dan sering kali pembungkusnya — sengaja pointer-transparent supaya tidak
     merebut klik dari tombol di atasnya, dan elemen pointer-transparent tidak
     pernah menerima pointermove. Posisinya tetap dihitung relatif terhadap
     kotak lapisan ini sendiri, jadi hasilnya sama. */
  useEffect(() => {
    if (!interactive) return undefined;
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [interactive, onPointerMove]);

  if (!src) return null;

  /* Hanya nilai yang benar-benar berbeda per seksi yang dioper ke DOM.
     Aturan mask, animasi, dan reduced-motion hidup di berkas CSS. */
  /* reach 0 berarti tidak ada lubang: dipakai saat lapisannya memang berdiri
     di kolomnya sendiri — seperti kisi di paruh kanan hero — sehingga tidak
     ada teks yang perlu dihindari. Melubanginya di situ justru menelan
     sorotan kursor, karena bagian tengahnya tidak digambar sama sekali. */
  const vars = {
    '--sc-mask':      reach ? `url('${src}'), ${clearing(reach)}` : `url('${src}')`,
    '--sc-mask-size': reach ? `${size}, cover` : size,
    '--sc-mask-pos':  reach ? `${position}, center` : position,
    '--sc-color':     color,
    '--sc-opacity':   opacity,
    '--sc-motion':    MOTION[motion] ?? MOTION.drift,
    '--sc-lit-color': litColor,
    '--sc-lit-radius': `${litRadius}px`,
  };

  return (
    <span ref={hostRef} aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden" style={vars}>
      {/* Satu lapisan saja. Saat interaktif, sorotannya menempel pada
          lapisan yang sama sebagai background-image di atas warna dasarnya —
          gambar yang sudah ada menguat, tidak digambar ulang. */}
      <span className={`sc-layer sc-layer--art${interactive ? ' is-lit' : ''}`} />
    </span>
  );
};

export default SectionBackdrop;
