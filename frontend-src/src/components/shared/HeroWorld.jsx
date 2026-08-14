import React, { useEffect, useRef, useState } from 'react';

/**
 * Peta dunia untuk hero, dengan denyut berkeliling di negara peneliti.
 *
 * Petanya disisipkan sebagai SVG sebenarnya, bukan dipasang lewat <img>.
 * Alasannya bukan selera: setiap negara di berkas itu adalah <path> ber-id,
 * dan kita perlu membaca posisi tiap negara di layar untuk menaruh denyut
 * tepat di atasnya. Lewat <img>, isi berkas tidak bisa dijangkau sama sekali,
 * jadi koordinat setiap negara harus ditulis tangan — daftar yang pasti
 * melenceng begitu petanya diganti.
 *
 * Denyutnya tidak menyala serentak di semua negara. Satu sorot berjalan
 * berkeliling: berhenti di satu negara, berdenyut, lalu meluncur ke negara
 * berikutnya yang dipilih acak. Perpindahannya diinterpolasi per frame dengan
 * pelandaian di kedua ujung, jadi yang terlihat adalah luncuran, bukan
 * lompatan.
 */

const SRC = '/assets/img/world-map.svg';
const ENDPOINT = '/api/researcher_distribution.php?groupBy=country';

/* Id di dalam berkas peta memakai tanda hubung ("Antigua-and-Barbuda"),
   sedangkan kolom country di basis data berisi nama biasa. Keduanya
   disederhanakan ke bentuk yang sama sebelum dibandingkan. */
const slug = (s) => String(s).toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');

/* Nama yang lazim berbeda antara data dan berkas peta. Tabel ini dipakai pada
   kedua sisi, jadi selama keduanya menuju bentuk yang sama, cocok. */
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

/*
 * Titik yang benar-benar berada di dalam wilayah negaranya.
 *
 * Pusat kotak pembatas tidak cukup. Negara berbentuk bulan sabit, negara yang
 * membungkus teluk, dan negara yang punya wilayah seberang laut — pusat
 * kotaknya jatuh di laut, dan denyutnya ikut mendarat di laut. Jadi pusat
 * kotak hanya dipakai bila memang berada di dalam isian; kalau tidak, kotaknya
 * dipindai dan diambil titik dalam-isian yang paling dekat ke pusat.
 */
const insidePoint = (path) => {
  const b = path.getBBox();
  if (!b.width || !b.height) return null;

  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  const test = (x, y) => {
    try { return path.isPointInFill(new DOMPoint(x, y)); } catch { return false; }
  };

  if (typeof path.isPointInFill !== 'function' || test(cx, cy)) return { x: cx, y: cy };

  const N = 9;
  let best = null;
  let bestD = Infinity;
  for (let i = 1; i < N; i += 1) {
    for (let j = 1; j < N; j += 1) {
      const x = b.x + (b.width  * i) / N;
      const y = b.y + (b.height * j) / N;
      if (!test(x, y)) continue;
      const d = (x - cx) ** 2 + (y - cy) ** 2;
      if (d < bestD) { bestD = d; best = { x, y }; }
    }
  }
  return best ?? { x: cx, y: cy };
};

/* Pelandaian di kedua ujung. Luncurannya berangkat pelan, cepat di tengah,
   lalu melambat sebelum berhenti — itu yang membuatnya tidak terbaca sebagai
   perpindahan mendadak. */
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2);

const HeroWorld = ({ radius = 230 }) => {
  const hostRef  = useRef(null);
  const mapRef   = useRef(null);
  const roamRef  = useRef(null);   // sorot yang berkeliling
  const ringRef  = useRef(null);   // gelang denyutnya

  const targetRef = useRef({ x: -9999, y: -9999 });
  const posRef    = useRef({ x: -9999, y: -9999 });
  const rafRef    = useRef(0);

  const [markers, setMarkers] = useState([]);
  const countriesRef = useRef(new Set());
  const markersRef   = useRef([]);
  const idleRef      = useRef([]);
  const idleWrapRef  = useRef(null);
  /* Ukuran lapisan disimpan, tidak dibaca ulang tiap frame. Dua gelung rAF
     berjalan bersamaan di sini — sorot berkeliling dan sorotan kursor — dan
     masing-masing memanggil getBoundingClientRect() memaksa hitung tata letak
     dua kali per frame. Terukur, itu saja menaikkan frame dari 16,7ms ke
     22,8ms saat kursor bergerak. */
  const sizeRef      = useRef({ w: 0, h: 0 });

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
      .catch(() => { /* tanpa data, tidak ada negara yang ditandai */ });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * Posisi diambil dalam koordinat gambar, lalu dipetakan ke layar lewat
   * getScreenCTM(). Berkas peta memakai transform pada grup induknya, jadi
   * koordinat lokal saja akan meleset; CTM sudah membawa seluruh transform
   * yang berlaku sampai ke layar.
   *
   * Hasilnya disimpan sebagai persen terhadap kotak SVG — bukan terhadap
   * seksi — supaya denyutnya tetap menempel di negaranya berapa pun lebar
   * lapisan petanya.
   */
  const measure = () => {
    const svg = mapRef.current?.querySelector('svg');
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    if (!box.width || !box.height) return;

    const ctm = svg.getScreenCTM();
    if (!ctm) return;

    const hb = hostRef.current?.getBoundingClientRect();
    if (hb) sizeRef.current = { w: hb.width, h: hb.height };

    const seen = new Set();
    const next = [];
    svg.querySelectorAll('path[id]').forEach((path) => {
      const id = canon(path.id);
      if (!id || seen.has(id)) return;
      const local = insidePoint(path);
      if (!local) return;
      const m = path.getScreenCTM();
      if (!m) return;
      const p = new DOMPoint(local.x, local.y).matrixTransform(m);
      seen.add(id);
      next.push({
        id,
        x: ((p.x - box.left) / box.width)  * 100,
        y: ((p.y - box.top)  / box.height) * 100,
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

  useEffect(() => {
    const wrap = idleWrapRef.current;
    idleRef.current = wrap
      ? markers.filter((m) => !m.active).map((m, i) => ({
          el: wrap.children[i], x: m.x / 100, y: m.y / 100, on: false,
        })).filter((d) => d.el)
      : [];
  }, [markers]);

  /* ── Sorot yang berkeliling ────────────────────────────────────────── */
  useEffect(() => {
    const roam = roamRef.current;
    const ring = ringRef.current;
    const host = hostRef.current;
    const list = markers.filter((m) => m.active);
    if (!roam || !ring || !host || list.length === 0) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      /* Tanpa gerak, sorotnya cukup berhenti di negara pertama. */
      roam.style.transform = `translate3d(${list[0].x}%, ${list[0].y}%, 0)`;
      return undefined;
    }

    let raf = 0;
    let from = list[0];
    let to   = list.length > 1 ? list[1] : list[0];
    let start = 0;
    let dur = 1;
    let phase = 'dwell';        // 'dwell' | 'travel'
    const DWELL = 1700;

    const place = (x, y) => {
      /* Persen tidak bisa dipakai langsung: ia akan relatif terhadap kotak
         sorot itu sendiri, bukan terhadap peta. Jadi dihitung ke piksel dari
         ukuran lapisan yang sudah disimpan. */
      const { w, h } = sizeRef.current;
      roam.style.transform = `translate3d(${(x / 100) * w}px, ${(y / 100) * h}px, 0)`;
    };

    const pick = () => {
      if (list.length < 2) return list[0];
      let n = to;
      /* Acak, tapi tidak boleh negara yang barusan. */
      for (let i = 0; i < 8 && n.id === to.id; i += 1) {
        n = list[Math.floor(Math.random() * list.length)];
      }
      return n;
    };

    const beat = () => {
      ring.classList.remove('is-beat');
      // memaksa alur ulang supaya animasinya benar-benar diputar dari awal
      void ring.offsetWidth;
      ring.classList.add('is-beat');
    };

    const tick = (now) => {
      if (!start) start = now;
      const t = now - start;

      if (phase === 'dwell') {
        if (t >= DWELL) {
          from = to;
          to = pick();
          /* Lama luncuran mengikuti jaraknya, dengan batas atas dan bawah:
             negara bertetangga tidak melesat, negara seberang benua tidak
             berjalan terlalu lama. */
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          dur = Math.min(2400, Math.max(900, d * 26));
          phase = 'travel';
          start = now;
        } else {
          place(to.x, to.y);
        }
      } else {
        const k = Math.min(1, t / dur);
        const e = ease(k);
        place(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e);
        if (k >= 1) { phase = 'dwell'; start = now; beat(); }
      }

      raf = requestAnimationFrame(tick);
    };

    place(to.x, to.y);
    beat();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [markers]);

  /* ── Sorotan kursor ────────────────────────────────────────────────── */
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    /* Denyut negara lain hanya dinyalakan saat benar-benar berada di dalam
       sorotan. Gelang yang beranimasi di balik mask tetap dibayar meski tak
       terlihat, dan ratusan di antaranya cukup untuk menjatuhkan laju frame.
       Penyalaannya lewat kelas, bukan state React: himpunan yang tersorot
       berubah hampir setiap frame, dan merender ulang komponen setiap frame
       justru memindahkan ongkosnya. */
    const near = () => {
      const { w, h } = sizeRef.current;
      if (!w) return;
      const { x, y } = posRef.current;
      const r2 = radius * radius;
      for (const d of idleRef.current) {
        const dx = d.x * w - x;
        const dy = d.y * h - y;
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

    /* Kotak dibaca di sini, sekali per gerakan pointer, bukan di dalam gelung
       rAF — dan sekalian dipakai menyegarkan ukuran yang disimpan. */
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      sizeRef.current = { w: r.width, h: r.height };
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

  const dots = (list, kind) => list.map((m) => (
    <span key={`${kind}-${m.id}`} className={`sc-pulse sc-pulse--${kind}`}
      style={{ left: `${m.x}%`, top: `${m.y}%` }} />
  ));

  return (
    <span ref={hostRef} aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ '--sc-radius': `${radius}px` }}>

      <span ref={mapRef} className="sc-world" />

      {/* Negara peneliti: titiknya tetap terlihat semua, supaya sebarannya
          terbaca. Yang berdenyut hanya satu — sorot yang berkeliling. */}
      <span className="sc-pulses">{dots(active, 'on')}</span>

      <span ref={roamRef} className="sc-roam">
        <span ref={ringRef} className="sc-roam__ring" />
      </span>

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
