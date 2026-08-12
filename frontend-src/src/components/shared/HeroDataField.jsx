import React, { useMemo, useState } from 'react';

/**
 * Lapisan data hidup di atas artwork hero.
 *
 * Selama `items` kosong — API belum menjawab, atau memang belum ada data —
 * komponen ini tidak menggambar apa pun, jadi yang terlihat hanya SVG latar
 * di belakangnya. Begitu data masuk, tiap SDG muncul sebagai penanda yang
 * posisinya tetap, ukurannya sebanding jumlah publikasi, dan warnanya memakai
 * warna resmi SDG itu. Menyorot penanda memunculkan angkanya.
 *
 * Jadi latarnya bukan gambar hias yang kebetulan ada di belakang teks — ia
 * membaca dari sumber data yang sama dengan grid SDG di bawah halaman.
 */
const HeroDataField = ({ items = [], labels }) => {
  const [active, setActive] = useState(null);

  /*
   * Posisi disebar dengan sudut emas. Sebarannya merata tanpa titik yang
   * bertumpuk, dan — yang penting — sepenuhnya deterministik: SDG yang sama
   * selalu mendarat di tempat yang sama, jadi latarnya tidak berloncatan
   * setiap kali halaman dirender ulang.
   */
  const points = useMemo(() => {
    if (!items.length) return [];
    const max = Math.max(...items.map(d => Number(d.count) || 0), 1);

    return items.map((d, i) => {
      const angle  = i * 137.508 * (Math.PI / 180);
      const radius = Math.sqrt((i + 0.5) / items.length);
      return {
        ...d,
        // Persen, bukan piksel, supaya sebarannya ikut lebar hero.
        x: 50 + Math.cos(angle) * radius * 42,
        y: 50 + Math.sin(angle) * radius * 32,
        size: 9 + (Number(d.count) || 0) / max * 15,
      };
    });
  }, [items]);

  if (!points.length) return null;

  return (
    <div aria-hidden={false} className="pointer-events-none absolute inset-0">
      {points.map((p) => {
        const isActive = active === p.sdg;
        return (
          <div key={p.sdg} className="absolute"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}>

            <button
              type="button"
              className="pointer-events-auto relative block cursor-help rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              style={{ width: p.size, height: p.size }}
              onMouseEnter={() => setActive(p.sdg)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(p.sdg)}
              onBlur={() => setActive(null)}
              aria-label={`SDG ${p.sdg} — ${p.name}: ${p.count}`}
            >
              {/* Denyut hanya pada penanda terbesar, supaya tidak ramai. */}
              {p.size > 18 && (
                <span className="absolute inset-0 animate-ping rounded-full opacity-40 motion-reduce:hidden"
                  style={{ backgroundColor: p.color }} />
              )}
              <span className="absolute inset-0 rounded-full ring-1 ring-white/40 transition-transform duration-200"
                style={{
                  backgroundColor: p.color,
                  boxShadow: `0 0 ${isActive ? 18 : 10}px 0 ${p.color}`,
                  transform: isActive ? 'scale(1.45)' : 'scale(1)',
                }} />
            </button>

            {isActive && (
              <div role="tooltip"
                className="absolute bottom-full left-1/2 z-20 mb-3 w-max max-w-[15rem] -translate-x-1/2 rounded-lg bg-[#13131B] px-3.5 py-2.5 text-left ring-1 ring-white/15 shadow-xl">
                <p className="flex items-center gap-2 font-mono text-xs tabular-nums text-slate-400">
                  <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: p.color }} />
                  SDG {String(p.sdg).padStart(2, '0')}
                </p>
                <p className="mt-1 text-[15px] font-semibold leading-snug text-white">{p.name}</p>
                <p className="mt-1 text-sm text-slate-400">
                  <span className="font-semibold tabular-nums text-white">
                    {Number(p.count).toLocaleString()}
                  </span>{' '}
                  {labels?.publications}
                  {p.percentage != null && (
                    <> · <span className="tabular-nums">{p.percentage}%</span> {labels?.share}</>
                  )}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default HeroDataField;