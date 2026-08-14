import React, { useEffect, useRef, useState } from 'react';

/**
 * Peta dunia untuk hero, dengan denyut berkeliling di negara peneliti.
 *
 * Soal gaya: seluruh tampilannya hidup di styles/homepage.css sebagai kelas
 * bernama — mask, promosi lapisan, warna isian negara, bentuk titiknya. Yang
 * tersisa sebagai nilai dari JavaScript hanyalah tiga hal yang memang tidak
 * bisa jadi nama kelas, karena baru diketahui saat halaman berjalan:
 *
 *   1. letak tiap negara — hasil pengukuran berkasnya sendiri;
 *   2. posisi sorot yang berkeliling — berubah tiap frame;
 *   3. posisi sorotan kursor — berubah tiap frame.
 *
 * Ketiganya dioper lewat custom property, dan yang membacanya tetap kelas di
 * stylesheet. Jadi tidak ada aturan tampilan yang disuntikkan ke DOM; yang
 * lewat DOM hanya angka.
 *
 * Petanya sendiri disisipkan sebagai SVG sebenarnya, bukan lewat <img>.
 * Alasannya bukan selera: tiap negara di berkas itu adalah <path> ber-nama,
 * dan posisinya perlu dibaca untuk menaruh denyut tepat di atasnya. Lewat
 * <img>, isi berkas tidak terjangkau sama sekali.
 */

const SRC = '/assets/img/world.svg';
const ENDPOINT = '/api/researcher_distribution.php?groupBy=country';

/* Wilayah lebih kecil dari ini tidak diberi titik latar: berkasnya memuat
   256 wilayah, banyak di antaranya pulau sebesar beberapa piksel. */
const MIN_SPAN = 7;

/* Nama negara di berkas peta dan di basis data disederhanakan ke bentuk yang
   sama sebelum dibandingkan. */
const slug = (s) => String(s).toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');

/* Nama yang lazim berbeda antara keduanya. Tabel ini dipakai pada kedua sisi,
   jadi selama keduanya menuju bentuk yang sama, cocok. */
const ALIAS = {
  'united-states': 'united-states-of-america',
  'usa': 'united-states-of-america',
  'us': 'united-states-of-america',
  'uk': 'united-kingdom',
  'great-britain': 'united-kingdom',
  'south-korea': 'republic-of-korea',
  'korea-south': 'republic-of-korea',
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

/* Pelandaian di kedua ujung: berangkat pelan, cepat di tengah, melambat
   sebelum berhenti — itu yang membuat perpindahannya terbaca sebagai
   luncuran, bukan lompatan. */
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2);

const HeroWorld = () => {
  const hostRef = useRef(null);
  const mapRef  = useRef(null);
  const roamRef = useRef(null);

  const targetRef = useRef({ x: -9999, y: -9999 });
  const posRef    = useRef({ x: -9999, y: -9999 });
  const rafRef    = useRef(0);
  const sizeRef   = useRef({ w: 0, h: 0 });

  const [markers, setMarkers] = useState([]);
  const countriesRef = useRef(new Set());

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
          el.removeAttribute('class');
          el.setAttribute('preserveAspectRatio', 'xMidYMid meet');
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
   * getScreenCTM() — koordinat lokal saja akan meleset kalau berkasnya
   * memakai transform. Hasilnya disimpan sebagai persen terhadap kotak SVG,
   * jadi tetap menempel di negaranya berapa pun lebar lapisan petanya.
   */
  const measure = () => {
    const svg = mapRef.current?.querySelector('svg');
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    if (!box.width || !box.height) return;

    const host = hostRef.current;
    if (host) {
      sizeRef.current = { w: box.width, h: box.height };
      host.style.setProperty('--sc-mw', `${box.width}px`);
      host.style.setProperty('--sc-mh', `${box.height}px`);
    }

    const seen = new Set();
    const next = [];
    svg.querySelectorAll('path').forEach((path) => {
      const id = canon(path.getAttribute('name') || path.id);
      if (!id || seen.has(id)) return;
      const local = insidePoint(path);
      if (!local) return;
      const m = path.getScreenCTM();
      if (!m) return;
      const p = new DOMPoint(local.x, local.y).matrixTransform(m);
      const bb = path.getBBox();
      seen.add(id);
      next.push({
        id,
        x: ((p.x - box.left) / box.width)  * 100,
        y: ((p.y - box.top)  / box.height) * 100,
        active: countriesRef.current.has(id),
        /* Berkas ini memuat 256 wilayah, banyak di antaranya pulau sebesar
           beberapa piksel. Kalau semuanya diberi titik, yang muncul di
           sekitar kursor bukan sebaran negara melainkan gumpalan. Yang
           tersaring hanya titik latar; negara yang punya peneliti selalu
           ditampilkan, sekecil apa pun wilayahnya. */
        tiny: bb.width < MIN_SPAN || bb.height < MIN_SPAN,
      });
    });

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

  /* ── Sorot yang berkeliling ────────────────────────────────────────── */
  useEffect(() => {
    const roam = roamRef.current;
    const list = markers.filter((m) => m.active);
    if (!roam || list.length === 0) return undefined;

    const put = (x, y) => {
      roam.style.setProperty('--sc-rx', `${x}%`);
      roam.style.setProperty('--sc-ry', `${y}%`);
    };

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      put(list[0].x, list[0].y);
      return undefined;
    }

    let raf = 0;
    let from = list[0];
    let to   = list.length > 1 ? list[1] : list[0];
    let start = 0;
    let dur = 1;
    let phase = 'dwell';
    const DWELL = 1700;

    const pick = () => {
      if (list.length < 2) return list[0];
      let n = to;
      for (let i = 0; i < 8 && n.id === to.id; i += 1) {
        n = list[Math.floor(Math.random() * list.length)];
      }
      return n;
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
          const d = Math.hypot(to.x - from.x, to.y - from.y);
          dur = Math.min(2400, Math.max(900, d * 26));
          phase = 'travel';
          start = now;
        }
      } else {
        const k = Math.min(1, t / dur);
        const e = ease(k);
        put(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e);
        if (k >= 1) { phase = 'dwell'; start = now; }
      }

      raf = requestAnimationFrame(tick);
    };

    put(to.x, to.y);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [markers]);

  /* ── Sorotan kursor ────────────────────────────────────────────────── */
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    const step = () => {
      const p = posRef.current;
      const t = targetRef.current;
      if (p.x < -9000) { p.x = t.x; p.y = t.y; }
      p.x += (t.x - p.x) * 0.18;
      p.y += (t.y - p.y) * 0.18;
      el.style.setProperty('--sc-gx', `${p.x.toFixed(1)}px`);
      el.style.setProperty('--sc-gy', `${p.y.toFixed(1)}px`);
      const settled = Math.abs(t.x - p.x) < 0.4 && Math.abs(t.y - p.y) < 0.4;
      rafRef.current = settled ? 0 : requestAnimationFrame(step);
    };

    /* Kotak dibaca sekali per gerakan pointer, bukan di dalam gelung rAF. */
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

  const active = markers.filter((m) => m.active);
  const rest   = markers.filter((m) => !m.active && !m.tiny);

  /* Letak tiap negara adalah hasil pengukuran, bukan nilai yang bisa ditulis
     jadi nama kelas — inilah satu-satunya tempat gaya sebaris di komponen
     ini, dan isinya memang koordinat, bukan aturan tampilan. */
  const at = (m) => ({ left: `${m.x}%`, top: `${m.y}%` });

  return (
    <div ref={hostRef} aria-hidden className="sc-world">
      <div ref={mapRef} className="sc-world__frame" />

      {/* Titik latar: diam dan samar, sekadar menandai negaranya ada. */}
      <div className="sc-world__pins">
        {rest.map((m) => (
          <span key={`bg-${m.id}`} style={at(m)} className="sc-pin sc-pin_faint" />
        ))}
      </div>

      {/* Negara peneliti: titiknya terlihat semua supaya sebarannya terbaca
          sekaligus. Yang berdenyut hanya satu — sorot yang berkeliling. */}
      <div className="sc-world__pins">
        {active.map((m) => (
          <span key={`on-${m.id}`} style={at(m)} className="sc-pin" />
        ))}
      </div>

      {active.length > 0 && (
        <div ref={roamRef} className="sc-roam">
          {/* Dua gelang berjeda beda: yang kedua menyusul saat yang pertama
              sedang memudar, jadi denyutnya terbaca menerus. */}
          <span className="sc-roam__wave sc-roam__wave_a" />
          <span className="sc-roam__wave sc-roam__wave_b" />
        </div>
      )}

      {/* Titik negara peneliti sekali lagi dalam warna sorot, hanya tampak di
          sekitar kursor. Karena persis bertumpuk di atas yang di bawahnya,
          yang berubah saat kursor lewat hanya warnanya. */}
      <div className="sc-spot">
        <div className="sc-spot__inner">
          {active.map((m) => (
            <span key={`hot-${m.id}`} style={at(m)} className="sc-pin sc-pin_lit" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroWorld;
