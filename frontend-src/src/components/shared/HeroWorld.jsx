import React, { useEffect, useRef, useState } from 'react';

/**
 * Peta dunia untuk hero, dengan denyut di negara peneliti terdaftar.
 *
 * Petanya disisipkan sebagai SVG sebenarnya, bukan dipasang lewat <img>.
 * Alasannya bukan selera: setiap negara di berkas itu adalah <path> ber-id,
 * dan kita perlu membaca posisi tiap negara di layar untuk menaruh denyut
 * tepat di atasnya. Lewat <img>, isi berkas tidak bisa dijangkau sama sekali,
 * jadi koordinat setiap negara harus ditulis tangan — daftar yang pasti
 * melenceng begitu petanya diganti.
 *
 * Tiga lapisan denyut:
 *
 *   1. Negara dengan peneliti terdaftar — berdenyut terus, warna pekat.
 *   2. Negara yang sama, warna sorot — hanya tampak di sekitar kursor. Karena
 *      titiknya identik dan hanya bertumpuk, yang berubah saat kursor lewat
 *      cuma warnanya; ukuran denyutnya tidak bergerak sedikit pun.
 *   3. Negara lain — muncul hanya di sekitar kursor, warna muda.
 *
 * Ukuran denyut sama untuk semua negara. Jumlah peneliti tidak memperbesar
 * apa pun; yang dibedakan hanya warna.
 */

const SRC = '/assets/img/world-map.svg';
const ENDPOINT = '/api/researcher_distribution.php?groupBy=country';

/* Id di dalam berkas peta memakai tanda hubung ("Antigua-and-Barbuda"),
   sedangkan kolom country di basis data berisi nama biasa. Keduanya
   disederhanakan ke bentuk yang sama sebelum dibandingkan. */
const slug = (s) => String(s).toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');

/* Nama yang lazim berbeda antara data dan berkas peta. Hanya yang benar-benar
   sering muncul; sisanya sudah tertangani oleh penyederhanaan di atas. */
const ALIAS = {
  'united-states': 'united-states-of-america',
  'usa': 'united-states-of-america',
  'us': 'united-states-of-america',
  'uk': 'united-kingdom',
  'great-britain': 'united-kingdom',
  'south-korea': 'republic-of-korea',
  'north-korea': 'dem-rep-korea',
  'russia': 'russian-federation',
  'vietnam': 'viet-nam',
  'laos': 'lao-pdr',
  'syria': 'syrian-arab-republic',
  'iran': 'iran-islamic-republic-of',
  'tanzania': 'united-republic-of-tanzania',
  'venezuela': 'venezuela-bolivarian-republic-of',
  'bolivia': 'bolivia-plurinational-state-of',
  'moldova': 'republic-of-moldova',
  'czech-republic': 'czechia',
  'ivory-coast': 'cote-d-ivoire',
  'cape-verde': 'cabo-verde',
  'swaziland': 'eswatini',
  'burma': 'myanmar',
};

const canon = (s) => { const k = slug(s); return ALIAS[k] ?? k; };

const HeroWorld = ({ radius = 250 }) => {
  const hostRef  = useRef(null);   // pembungkus, tempat --gx/--gy ditulis
  const mapRef   = useRef(null);   // wadah SVG
  const targetRef = useRef({ x: -9999, y: -9999 });
  const posRef    = useRef({ x: -9999, y: -9999 });
  const rafRef    = useRef(0);

  const [markers, setMarkers] = useState([]);   // { id, x, y, active }
  const countriesRef = useRef(new Set());       // negara dengan peneliti
  const markersRef   = useRef([]);              // salinan untuk dibaca di dalam rAF
  const idleRef      = useRef([]);              // { el, x, y, on } titik negara lain
  const idleWrapRef  = useRef(null);

  /* ── Peta ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    let alive = true;
    fetch(SRC)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((svg) => {
        if (!alive || !mapRef.current) return;
        mapRef.current.innerHTML = svg;
        const el = mapRef.current.querySelector('svg');
        if (el) {
          el.removeAttribute('width');
          el.removeAttribute('height');
          el.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          el.classList.add('sc-world__svg');
        }
        measure();
      })
      .catch(() => { /* peta gagal dimuat: hero tetap tampil tanpa latar */ });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Negara peneliti ───────────────────────────────────────────────── */
  useEffect(() => {
    let alive = true;
    fetch(ENDPOINT)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        if (!alive) return;
        const rows = Array.isArray(j?.data) ? j.data : [];
        countriesRef.current = new Set(
          rows.filter((r) => Number(r.researchers) > 0).map((r) => canon(r.name)),
        );
        measure();
      })
      .catch(() => { /* tanpa data, seluruh negara memakai denyut muda */ });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Posisi tiap negara diukur dari kotak yang benar-benar dirender, bukan
     dari daftar koordinat. Berkas peta memakai transform pada grup induknya,
     jadi getBBox() saja akan meleset; getBoundingClientRect() sudah membawa
     seluruh transform yang berlaku. Hasilnya disimpan dalam persen supaya
     tetap benar saat ukuran hero berubah. */
  const measure = () => {
    const host = mapRef.current;
    const svg  = host?.querySelector('svg');
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    if (!box.width || !box.height) return;

    /* Isi sorotan perlu tahu ukuran heronya: ia hidup di dalam kotak sebesar
       sorotan, sementara titik di dalamnya berposisi persen terhadap hero. */
    const frame = hostRef.current;
    if (frame) {
      const fb = frame.getBoundingClientRect();
      frame.style.setProperty('--sc-w', `${fb.width}px`);
      frame.style.setProperty('--sc-h', `${fb.height}px`);
    }

    const seen = new Set();
    const next = [];
    svg.querySelectorAll('path[id]').forEach((path) => {
      const id = canon(path.id);
      if (!id || seen.has(id)) return;
      const r = path.getBoundingClientRect();
      if (!r.width || !r.height) return;
      seen.add(id);
      next.push({
        id,
        x: ((r.left + r.width / 2) - box.left) / box.width * 100,
        y: ((r.top + r.height / 2) - box.top) / box.height * 100,
        active: countriesRef.current.has(id),
      });
    });
    markersRef.current = next;
    setMarkers(next);
  };

  useEffect(() => {
    const host = mapRef.current;
    if (!host || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => measure());
    ro.observe(host);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Elemen titik dikumpulkan sekali setiap daftar negara berubah, supaya
     gelung rAF tidak perlu menyentuh DOM untuk mencarinya tiap frame. */
  useEffect(() => {
    const wrap = idleWrapRef.current;
    idleRef.current = wrap
      ? markers.filter((m) => !m.active).map((m, i) => ({
          el: wrap.children[i], x: m.x / 100, y: m.y / 100, on: false,
        })).filter((d) => d.el)
      : [];
  }, [markers]);

  /* ── Sorotan kursor ────────────────────────────────────────────────── */
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    /* Denyut negara lain hanya dinyalakan saat benar-benar berada di dalam
       sorotan. Gelang yang beranimasi di balik mask tetap dibayar meski tak
       terlihat: dengan 190 gelang berjalan terus, frame saat kursor bergerak
       diukur 21,6ms; dengan hanya yang tersorot, 16,7ms.
     *
     * Penyalaannya lewat kelas, bukan lewat state React. Himpunan yang
     * tersorot berubah hampir setiap frame, dan merender ulang komponen
     * setiap frame justru memindahkan ongkosnya, bukan menghilangkannya —
     * itu terukur 24ms. Yang disentuh di sini hanya elemen yang statusnya
     * benar-benar berubah. */
    const near = () => {
      const box = el.getBoundingClientRect();
      if (!box.width) return;
      const { x, y } = posRef.current;
      const r2 = radius * radius;
      for (const d of idleRef.current) {
        const dx = d.x * box.width  - x;
        const dy = d.y * box.height - y;
        const on = dx * dx + dy * dy <= r2;
        if (on !== d.on) { d.on = on; d.el.classList.toggle('is-near', on); }
      }
    };

    const step = () => {
      const p = posRef.current;
      const t = targetRef.current;
      if (p.x < -9000) { p.x = t.x; p.y = t.y; }
      p.x += (t.x - p.x) * 0.18;
      p.y += (t.y - p.y) * 0.18;
      el.style.setProperty('--gx', `${p.x.toFixed(1)}px`);
      el.style.setProperty('--gy', `${p.y.toFixed(1)}px`);
      near();
      const settled = Math.abs(t.x - p.x) < 0.4 && Math.abs(t.y - p.y) < 0.4;
      rafRef.current = settled ? 0 : requestAnimationFrame(step);
    };

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
  }, [radius]);

  const active = markers.filter((m) => m.active);
  const rest   = markers.filter((m) => !m.active);

  const dots = (list, kind) => list.map((m, i) => (
    <span key={`${kind}-${m.id}`} className={`sc-pulse sc-pulse--${kind}`}
      style={{
        left: `${m.x}%`,
        top:  `${m.y}%`,
        /* Jeda dibuat menyebar supaya denyutnya tidak serempak seperti
           lampu sein; nilainya tetap per negara, bukan acak tiap render. */
        animationDelay: `${(i % 12) * 0.32}s`,
      }} />
  ));

  return (
    <span ref={hostRef} aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ '--sc-radius': `${radius}px` }}>

      <span ref={mapRef} className="sc-world" />

      {/* Denyut negara peneliti — selalu tampak. */}
      <span className="sc-pulses">{dots(active, 'on')}</span>

      {/* Titik yang sama dalam warna sorot, dan negara lain dalam warna muda.
          Keduanya hanya tampak di dalam sorotan yang mengikuti kursor. */}
      <span className="sc-spot">
        <span className="sc-spot__inner">
          {dots(active, 'hot')}
          <span ref={idleWrapRef} className="sc-pulses">{dots(rest, 'idle')}</span>
        </span>
      </span>
    </span>
  );
};

export default HeroWorld;
