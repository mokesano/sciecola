import React, { useRef, useCallback } from 'react';

/**
 * Sistem warna per-seksi untuk halaman bertema gelap.
 *
 * Tiga aksen dirotasi supaya seksi yang bersebelahan tidak pernah sewarna:
 * biru → oranye → oranye tua mendekati merah. Tiap aksen membawa nada latar,
 * warna artwork, warna cahaya sekitar, dan kelas-kelas komponennya sendiri.
 *
 * Kelas Tailwind ditulis utuh sebagai string, bukan dirangkai dari variabel,
 * supaya tetap terbaca pemindai kelas.
 */
export const ACCENTS = {
  blue: {
    surface: 'bg-[#08080C]',
    art:     '#4F46E5',                  // tint dasar artwork
    lit:     'rgba(165,180,252,0.95)',   // artwork saat dilewati pointer
    blob:    'rgba(79,70,229,0.20)',
    spot:    'rgba(129,140,248,0.20)',
    rule:    'bg-indigo-500/70',
    eyebrow: 'text-indigo-400',
    numeral: 'text-indigo-400',
    ring:    'hover:ring-indigo-400/45',
    tile:    'bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/30',
    chip:    'text-indigo-300',
    dot:     'bg-indigo-400 shadow-[0_0_8px_2px_rgba(129,140,248,0.8)]',
    link:    'text-indigo-400 hover:text-indigo-300',
    button:  'bg-indigo-500 hover:bg-indigo-400 shadow-lg shadow-indigo-500/30',
    step:    'bg-indigo-500 shadow-lg shadow-indigo-500/40',
  },
  orange: {
    surface: 'bg-[#0D0906]',
    art:     '#EA580C',
    lit:     'rgba(253,186,116,0.95)',
    blob:    'rgba(234,88,12,0.20)',
    spot:    'rgba(251,146,60,0.20)',
    rule:    'bg-orange-500/70',
    eyebrow: 'text-orange-400',
    numeral: 'text-orange-400',
    ring:    'hover:ring-orange-400/45',
    tile:    'bg-orange-500/15 text-orange-300 ring-1 ring-orange-400/30',
    chip:    'text-orange-300',
    dot:     'bg-orange-400 shadow-[0_0_8px_2px_rgba(251,146,60,0.8)]',
    link:    'text-orange-400 hover:text-orange-300',
    button:  'bg-orange-500 hover:bg-orange-400 shadow-lg shadow-orange-500/30',
    step:    'bg-orange-500 shadow-lg shadow-orange-500/40',
  },
  ember: {
    surface: 'bg-[#0F0706]',
    art:     '#DC2626',
    lit:     'rgba(252,165,165,0.95)',
    blob:    'rgba(220,38,38,0.18)',
    spot:    'rgba(248,113,113,0.20)',
    rule:    'bg-red-500/70',
    eyebrow: 'text-red-400',
    numeral: 'text-red-400',
    ring:    'hover:ring-red-400/45',
    tile:    'bg-red-500/15 text-red-300 ring-1 ring-red-400/30',
    chip:    'text-red-300',
    dot:     'bg-red-400 shadow-[0_0_8px_2px_rgba(248,113,113,0.8)]',
    link:    'text-red-400 hover:text-red-300',
    button:  'bg-red-500 hover:bg-red-400 shadow-lg shadow-red-500/30',
    step:    'bg-red-500 shadow-lg shadow-red-500/40',
  },
};

export const ART = {
  hero:     '/assets/img/sections/hero-grid.svg',
  coverage: '/assets/img/sections/globe.svg',
  network:  '/assets/img/sections/network.svg',
  flow:     '/assets/img/sections/flow.svg',
  waves:    '/assets/img/sections/waves.svg',
};

/* Kartu bergaris rambut dengan sorot dalam di tepi atas — permukaannya
   terbaca terangkat dari bidang gelap, bukan tercetak rata di atasnya. */
export const CARD =
  'rounded-xl bg-white/[0.035] ring-1 ring-white/10 ' +
  'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)] transition-colors duration-300';

/* Menulis posisi pointer ke custom property pada node DOM lewat ref.
   Menyimpannya di state akan memicu render ulang puluhan kali per detik untuk
   sesuatu yang tidak mengubah struktur apa pun. */
function usePointer() {
  const ref = useRef(null);
  const onPointerMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, []);
  return { ref, onPointerMove };
}

/**
 * Seksi dengan latar bergambar yang bisa diwarnai.
 *
 * SVG-nya dipasang sebagai CSS mask, bukan sebagai gambar. Sebagai mask, satu
 * berkas bisa diwarnai apa saja — jadi artwork yang sama mengikuti aksen tiap
 * seksi tanpa perlu menyimpan satu salinan per warna. Lapisan kedua memakai
 * mask yang sama tetapi diisi gradien radial di posisi pointer, sehingga
 * gambar latarnya menyala tepat di bawah kursor.
 */
export const AmbientSection = ({
  accent = 'blue',
  art,
  artOpacity = 0.55,
  artPosition = 'center',
  fade = true,
  blob = true,
  className = '',
  children,
  ...rest
}) => {
  const a = ACCENTS[accent] ?? ACCENTS.blue;
  const { ref, onPointerMove } = usePointer();

  /* Dua lapis mask: bentuk artwork-nya sendiri, lalu — bila fade aktif —
     sebuah elips yang memudarkan tepinya, digabung dengan intersect supaya
     seksi tidak terpotong tajam ke seksi berikutnya. */
  const EDGE = 'radial-gradient(ellipse 85% 75% at 50% 50%, #000 30%, transparent 100%)';
  const maskStyle = art ? {
    WebkitMaskImage:    fade ? `url('${art}'), ${EDGE}` : `url('${art}')`,
    maskImage:          fade ? `url('${art}'), ${EDGE}` : `url('${art}')`,
    WebkitMaskSize:     fade ? 'cover, cover' : 'cover',
    maskSize:           fade ? 'cover, cover' : 'cover',
    WebkitMaskPosition: fade ? `${artPosition}, center` : artPosition,
    maskPosition:       fade ? `${artPosition}, center` : artPosition,
    WebkitMaskRepeat:   'no-repeat',
    maskRepeat:         'no-repeat',
    ...(fade ? { WebkitMaskComposite: 'source-in', maskComposite: 'intersect' } : {}),
  } : null;

  return (
    <section
      ref={ref}
      onPointerMove={onPointerMove}
      className={`relative overflow-hidden ${a.surface} ${className}`}
      {...rest}
    >
      {art && (
        <>
          {/* Artwork dasar, diwarnai aksen seksi */}
          <span aria-hidden className="pointer-events-none absolute inset-0"
            style={{ ...maskStyle, backgroundColor: a.art, opacity: artOpacity }} />
          {/* Artwork yang menyala mengikuti pointer */}
          <span aria-hidden className="pointer-events-none absolute inset-0 motion-reduce:hidden"
            style={{
              ...maskStyle,
              background: `radial-gradient(340px circle at var(--mx, -999px) var(--my, -999px), ${a.lit}, transparent 65%)`,
            }} />
        </>
      )}

      {blob && (
        <span aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[30rem] w-[52rem] -translate-x-1/2 -translate-y-1/3 rounded-full blur-[110px]"
          style={{ background: a.blob }} />
      )}

      <div className="relative">{children}</div>
    </section>
  );
};

/**
 * Kartu dengan sorot yang mengikuti kursor, mewarisi warna aksen seksinya.
 */
export const SpotlightCard = ({
  as: Tag = 'div',
  accent = 'blue',
  glow,
  radius = 300,
  className = '',
  children,
  ...rest
}) => {
  const a = ACCENTS[accent] ?? ACCENTS.blue;
  const { ref, onPointerMove } = usePointer();

  return (
    <Tag
      ref={ref}
      onPointerMove={onPointerMove}
      className={`group relative overflow-hidden ${className}`}
      {...rest}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:hidden"
        style={{
          background: `radial-gradient(${radius}px circle at var(--mx, 50%) var(--my, 50%), ${glow ?? a.spot}, transparent 70%)`,
        }}
      />
      <span className="relative block">{children}</span>
    </Tag>
  );
};

export default AmbientSection;
