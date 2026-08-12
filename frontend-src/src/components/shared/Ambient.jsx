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

/*
 * Varian terang dari tiap aksen. Halaman About, Teams, dan profil anggota
 * berlatar putih dengan gambar latar; warnanya harus dinaikkan kontrasnya
 * supaya tetap terbaca di atas bidang terang.
 */
export const LIGHT = {
  blue: {
    surface: 'bg-white', art: '#4F46E5', lit: 'rgba(79,70,229,0.85)',
    blob: 'rgba(99,102,241,0.10)', spot: 'rgba(99,102,241,0.10)',
    rule: 'bg-indigo-600', eyebrow: 'text-indigo-700', numeral: 'text-indigo-700',
    ring: 'hover:ring-indigo-300 hover:shadow-md',
    tile: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
    chip: 'text-indigo-700', link: 'text-indigo-700 hover:text-indigo-800',
    button: 'bg-indigo-600 hover:bg-indigo-700 shadow-sm',
    bar: 'bg-indigo-600',
  },
  orange: {
    surface: 'bg-orange-50/40', art: '#EA580C', lit: 'rgba(234,88,12,0.85)',
    blob: 'rgba(249,115,22,0.10)', spot: 'rgba(249,115,22,0.10)',
    rule: 'bg-orange-600', eyebrow: 'text-orange-700', numeral: 'text-orange-700',
    ring: 'hover:ring-orange-300 hover:shadow-md',
    tile: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    chip: 'text-orange-700', link: 'text-orange-700 hover:text-orange-800',
    button: 'bg-orange-600 hover:bg-orange-700 shadow-sm',
    bar: 'bg-orange-600',
  },
  ember: {
    surface: 'bg-red-50/40', art: '#DC2626', lit: 'rgba(220,38,38,0.85)',
    blob: 'rgba(239,68,68,0.10)', spot: 'rgba(239,68,68,0.10)',
    rule: 'bg-red-600', eyebrow: 'text-red-700', numeral: 'text-red-700',
    ring: 'hover:ring-red-300 hover:shadow-md',
    tile: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    chip: 'text-red-700', link: 'text-red-700 hover:text-red-800',
    button: 'bg-red-600 hover:bg-red-700 shadow-sm',
    bar: 'bg-red-600',
  },
};

export const ART = {
  hero:     '/assets/img/sections/hero-grid.svg',
  coverage: '/assets/img/sections/globe.svg',
  network:  '/assets/img/sections/network.svg',
  flow:     '/assets/img/sections/flow.svg',
  waves:    '/assets/img/sections/waves.svg',
  // Aset peta yang sudah ada di aplikasi. Path-nya tidak membawa fill="none",
  // jadi ia terender pekat dan bekerja sebagai mask — cakupan global memang
  // paling jujur digambarkan peta sungguhan, bukan bola buatan.
  world:    '/assets/img/world.svg',
  about:    '/assets/img/sections/about.svg',
  team:     '/assets/img/sections/team.svg',
};

/*
 * Kartu memakai permukaan pekat, bukan sapuan transparan. Kartu transparan
 * ikut menampilkan artwork latar di baliknya, sehingga teks di atasnya duduk
 * pada bidang yang berubah-ubah dan kontrasnya tidak pernah pasti.
 *
 * CARD  — kartu pekat untuk halaman gelap
 * PANEL — kartu pekat untuk halaman terang
 * Keduanya membawa sorot dalam setipis rambut di tepi atas, supaya
 * permukaannya terbaca terangkat dari bidang di belakangnya.
 */
export const CARD =
  'rounded-xl bg-[#13131B] ring-1 ring-white/10 ' +
  'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07),0_1px_2px_0_rgba(0,0,0,0.4)] ' +
  'transition-colors duration-300';

export const PANEL =
  'rounded-xl bg-white ring-1 ring-slate-200 ' +
  'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_1px_3px_0_rgba(15,23,42,0.08)] ' +
  'transition-all duration-300';

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
  tone = 'dark',
  art,
  artOpacity = 0.55,
  artPosition = 'center',
  fade = true,
  blob = true,
  photo,          // aset raster yang sudah ada, dipakai sebagai foto latar
  photoOpacity = 0.28,
  surfaceColor,   // hex; menggantikan kelas permukaan aksen
  artColor,       // hex; menggantikan tint artwork aksen
  litColor,       // warna artwork saat dilewati pointer
  blobColor,
  className = '',
  children,
  ...rest
}) => {
  const set = tone === 'light' ? LIGHT : ACCENTS;
  const a = set[accent] ?? set.blue;
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
      className={`relative overflow-hidden ${surfaceColor ? '' : a.surface} ${className}`}
      style={surfaceColor ? { backgroundColor: surfaceColor } : undefined}
      {...rest}
    >
      {photo && (
        <>
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${photo}')`, opacity: photoOpacity }} />
          {/* Tirai supaya teks tetap terbaca di atas foto apa pun */}
          <span aria-hidden className="pointer-events-none absolute inset-0"
            style={{ backgroundColor: tone === 'light' ? 'rgba(255,255,255,0.72)' : 'rgba(8,8,12,0.72)' }} />
        </>
      )}

      {art && (
        <>
          {/* Artwork dasar, diwarnai aksen seksi */}
          <span aria-hidden className="pointer-events-none absolute inset-0"
            style={{ ...maskStyle, backgroundColor: artColor ?? a.art, opacity: artOpacity }} />
          {/* Artwork yang menyala mengikuti pointer */}
          <span aria-hidden className="pointer-events-none absolute inset-0 motion-reduce:hidden"
            style={{
              ...maskStyle,
              background: `radial-gradient(340px circle at var(--mx, -999px) var(--my, -999px), ${litColor ?? a.lit}, transparent 65%)`,
            }} />
        </>
      )}

      {blob && (
        <span aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[30rem] w-[52rem] -translate-x-1/2 -translate-y-1/3 rounded-full blur-[110px]"
          style={{ background: blobColor ?? a.blob }} />
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
  tone = 'dark',
  glow,
  radius = 300,
  className = '',
  children,
  ...rest
}) => {
  const a = (tone === 'light' ? LIGHT : ACCENTS)[accent] ?? ACCENTS.blue;
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