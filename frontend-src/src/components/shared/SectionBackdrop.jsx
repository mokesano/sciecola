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
 * 3. Gerakannya lambat dan tidak berulang persis: drift, pan, atau denyut.
 *    Dimatikan sepenuhnya bila pengguna meminta gerak minimal.
 */

const KEYFRAMES = `
@keyframes sc-drift {
  0%   { transform: translate3d(0, 0, 0) scale(1.06); }
  100% { transform: translate3d(-2.5%, 1.8%, 0) scale(1.12); }
}
@keyframes sc-pan {
  0%   { transform: translate3d(-3.5%, 0, 0) scale(1.08); }
  100% { transform: translate3d(3.5%, 0, 0) scale(1.08); }
}
@keyframes sc-breathe {
  0%   { transform: scale(1.02); opacity: .55; }
  100% { transform: scale(1.12); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .sc-backdrop { animation: none !important; }
}
`;

/* Keyframes disuntikkan sekali untuk seluruh halaman. Merender <style> di
   dalam komponen akan menghasilkan satu salinan per seksi. */
let injected = false;
function useKeyframesOnce() {
  useEffect(() => {
    if (injected || typeof document === 'undefined') return;
    injected = true;
    const el = document.createElement('style');
    el.dataset.scBackdrop = '';
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
  }, []);
}

/*
 * Lubang tempat teks duduk. Transparan di tengah — di situ artwork tidak
 * digambar — lalu menguat penuh ke tepi. `reach` mengatur seberapa lebar
 * lubangnya: seksi yang teksnya melebar butuh lubang lebih besar.
 */
const clearing = (reach) =>
  `radial-gradient(ellipse ${reach}% ${Math.round(reach * 0.82)}% at 50% 50%,` +
  ' rgba(0,0,0,0) 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.35) 58%, #000 82%)';

const MOTION = {
  drift:   'sc-drift 34s ease-in-out infinite alternate',
  pan:     'sc-pan 46s ease-in-out infinite alternate',
  breathe: 'sc-breathe 22s ease-in-out infinite alternate',
  none:    undefined,
};

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
  useKeyframesOnce();

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

  /* Lapisan interaktif harus menerima pointer, tapi tidak boleh merebutnya
     dari tombol dan tautan di atasnya — pengait dipasang di lapisan latar,
     yang selalu berada di bawah isi seksi. */
  useEffect(() => {
    if (!interactive) return undefined;
    const host = hostRef.current;
    const section = host?.parentElement;
    if (!section) return undefined;
    section.addEventListener('pointermove', onPointerMove);
    return () => section.removeEventListener('pointermove', onPointerMove);
  }, [interactive, onPointerMove]);

  if (!src) return null;

  const maskFor = (r) => ({
    WebkitMaskImage:    `url('${src}'), ${clearing(r)}`,
    maskImage:          `url('${src}'), ${clearing(r)}`,
    WebkitMaskSize:     `${size}, cover`,
    maskSize:           `${size}, cover`,
    WebkitMaskPosition: `${position}, center`,
    maskPosition:       `${position}, center`,
    WebkitMaskRepeat:   'no-repeat',
    maskRepeat:         'no-repeat',
    WebkitMaskComposite: 'source-in',
    maskComposite:       'intersect',
  });

  return (
    <span ref={hostRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Artwork dasar — bentuknya sendiri ∩ lubang teks. */}
      <span
        className="sc-backdrop absolute inset-0"
        style={{ backgroundColor: color, opacity, animation: MOTION[motion],
                 willChange: 'transform', ...maskFor(reach) }}
      />

      {/* Lapisan yang menyala mengikuti kursor. Mask-nya sama persis, jadi
          yang menyala benar-benar gambarnya — bukan lingkaran cahaya di
          atasnya — dan lubang teks tetap berlaku, sehingga sorotan tidak
          pernah masuk ke area baca. */}
      {interactive && (
        <span
          className="absolute inset-0 motion-reduce:hidden"
          style={{
            ...maskFor(reach),
            background: `radial-gradient(${litRadius}px circle at var(--mx, -999px) var(--my, -999px), ${litColor}, transparent 68%)`,
          }}
        />
      )}
    </span>
  );
};

export default SectionBackdrop;
