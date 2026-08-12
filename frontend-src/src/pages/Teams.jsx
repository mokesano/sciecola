import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AmbientSection, SpotlightCard, LIGHT, ART, PANEL } from '../components/shared/Ambient';

/* ─── helpers ────────────────────────────────────────────────────────────── */

function getInitials(name) {
  return (name ?? '').replace(/^(Dr\.|Prof\.|Drs\.|Ir\.)\s+/i, '')
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map(w => w[0]).join('').toUpperCase();
}

/*
 * Grid mengikuti jumlah anggota di grup, bukan dikunci empat kolom. Satu
 * anggota di grid empat kolom menyisakan tiga sel kosong. Kelas ditulis utuh
 * supaya tetap terbaca pemindai kelas Tailwind.
 */
function gridForCount(n) {
  if (n === 1) return 'grid-cols-1 max-w-xs';
  if (n === 2) return 'grid-cols-1 sm:grid-cols-2 max-w-xl';
  if (n === 3) return 'grid-cols-2 sm:grid-cols-3 max-w-3xl';
  if (n === 4) return 'grid-cols-2 sm:grid-cols-4 max-w-4xl';
  return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
}

/* ─── portrait ───────────────────────────────────────────────────────────── */
const Portrait = ({ photo, name }) => {
  const [err, setErr] = useState(false);
  const showImage = photo && !err;
  return (
    <div className="mx-auto h-32 w-32 overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-200 transition-all duration-300 group-hover:ring-indigo-300">
      {showImage ? (
        <img src={photo} alt={name} onError={() => setErr(true)}
          className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-2xl font-medium tracking-wide text-slate-500">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
};

/* ─── member record ──────────────────────────────────────────────────────── */
const MemberCard = ({ member, t, accent }) => (
  <SpotlightCard as={Link} to={`/teams/${member.slug}`} accent={accent} radius={220}
    className={`${PANEL} ${LIGHT[accent].ring} flex flex-col items-center p-6 text-center`}>
    <Portrait photo={member.photo} name={member.name} />

    <h3 className="mt-5 text-lg font-semibold leading-snug text-slate-900">{member.name}</h3>

    {member.department && (
      <p className="mt-1.5 text-[15px] leading-snug text-slate-500">{member.department}</p>
    )}
    {member.location && (
      <p className="text-[15px] leading-snug text-slate-500">{member.location}</p>
    )}

    {/* Jabatan terakhir dan beraksen — itu fakta pembeda, bukan afiliasinya. */}
    {member.position && (
      <p className={`mt-3 text-[15px] font-medium ${LIGHT[accent].chip}`}>{member.position}</p>
    )}

    <span className="mt-3 text-sm text-slate-500 transition-colors group-hover:text-slate-400">
      {t('card.view_profile')}
    </span>
  </SpotlightCard>
);

/* ─── main ────────────────────────────────────────────────────────────────── */
const Teams = () => {
  const { t } = useTranslation('teams');

  const [members,     setMembers]     = useState([]);
  const [deptCounts,  setDeptCounts]  = useState({});
  const [departments, setDepartments] = useState([]);
  const [activeDept,  setActiveDept]  = useState('all');
  const [search,      setSearch]      = useState('');
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/wrapper/teams.php?limit=200');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.status !== 'success') throw new Error(json.message || 'error');
      setMembers(json.members ?? []);
      setDeptCounts(json.department_counts ?? {});
      setDepartments(json.departments ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = members.filter(m => {
    const matchDept = activeDept === 'all' || m.department === activeDept;
    const q = search.trim().toLowerCase();
    const matchSearch = !q
      || m.name.toLowerCase().includes(q)
      || (m.position ?? '').toLowerCase().includes(q)
      || (m.expertise ?? []).some(e => e.toLowerCase().includes(q));
    return matchDept && matchSearch;
  });

  const grouped = {};
  filtered.forEach(m => {
    const d = m.department ?? 'Other';
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(m);
  });

  const countries = new Set(
    members.map(m => m.location).filter(Boolean).map(l => l.split(',').pop().trim())
  ).size;
  const hasFilter = activeDept !== 'all' || search.trim() !== '';

  return (
    <main className="min-h-screen bg-white pt-20">

      {/* ══ MASTHEAD — biru ═════════════════════════════════════════ */}
      <AmbientSection tone="light" accent="blue" art={ART.team} artOpacity={0.45}>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <nav className="mb-10 flex items-center gap-2 text-[15px] text-slate-500">
            <Link to="/"      className="hover:text-slate-900 hover:underline">{t('breadcrumb.home')}</Link>
            <span className="text-slate-400">/</span>
            <Link to="/about" className="hover:text-slate-900 hover:underline">{t('breadcrumb.about')}</Link>
            <span className="text-slate-400">/</span>
            <span className="text-slate-400">{t('breadcrumb.current')}</span>
          </nav>

          <header className="mx-auto max-w-3xl text-center">
            <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${LIGHT.blue.eyebrow}`}>
              {t('breadcrumb.current')}
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 lg:text-5xl">
              {t('header.title')}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-slate-500">{t('header.subtitle')}</p>
          </header>

          {!loading && !error && members.length > 2 && (
            <dl className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-x-8">
              <Figure value={members.length}     label={t('stats.members')} />
              <Figure value={departments.length} label={t('stats.departments')} />
              <Figure value={countries}          label={t('stats.countries')} />
            </dl>
          )}
        </div>
      </AmbientSection>

      {/* ══ ROSTER — oranye ═════════════════════════════════════════ */}
      <AmbientSection tone="light" accent="orange" art={ART.coverage} artOpacity={0.3}
        className="border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">

          {/* Menyaring daftar yang muat dalam satu layar tidak ada gunanya —
              bilahnya baru muncul saat rosternya cukup panjang. */}
          {!loading && !error && members.length > 6 && (
            <div className="mb-14 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-xs">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('filter.search')}
                  className="w-full rounded-lg bg-white py-2.5 pl-10 pr-3 text-[15px] text-slate-900 ring-1 ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:pb-0">
                <DeptTab label={t('filter.all')} count={members.length}
                  active={activeDept === 'all'} onClick={() => setActiveDept('all')} />
                {departments.map(d => (
                  <DeptTab key={d.id} label={d.name}
                    count={deptCounts[d.name] ?? 0}
                    active={activeDept === d.name}
                    onClick={() => setActiveDept(d.name)} />
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-3 py-24 text-[15px] text-slate-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-orange-500" />
              {t('loading')}
            </div>
          )}

          {error && !loading && (
            <div className={`${PANEL} px-6 py-12 text-center`}>
              <p className="text-[15px] font-medium text-slate-900">{t('error')}</p>
              <button onClick={fetchData}
                className="mt-5 rounded-lg bg-white px-5 py-2.5 text-[15px] font-medium text-slate-700 ring-1 ring-slate-300 transition-colors hover:bg-slate-50">
                {t('retry')}
              </button>
            </div>
          )}

          {!loading && !error && (
            filtered.length === 0 ? (
              <EmptyState hasFilter={hasFilter} t={t}
                onReset={() => { setActiveDept('all'); setSearch(''); }} />
            ) : (
              <div className="space-y-20">
                {Object.entries(grouped).map(([deptName, list]) => (
                  <section key={deptName}>
                    {/* Judul divisi hanya berguna kalau ada divisi lain untuk
                        dibedakan. Satu grup tunggal cukup memakai judul halaman. */}
                    {Object.keys(grouped).length > 1 && (
                      <div className="mb-12 text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{deptName}</h2>
                        <div aria-hidden className={`mx-auto mt-3 h-px w-10 ${LIGHT.orange.rule}`} />
                        <p className="mt-3 text-[15px] tabular-nums text-slate-500">{list.length}</p>
                      </div>
                    )}
                    <div className={`mx-auto grid gap-5 ${gridForCount(list.length)}`}>
                      {list.map(m => <MemberCard key={m.id} member={m} t={t} accent="orange" />)}
                    </div>
                  </section>
                ))}
              </div>
            )
          )}

          {!loading && !error && members.length > 0 && (
            <p className="mt-16 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
              {t('admin_note')}
            </p>
          )}
        </div>
      </AmbientSection>

      {/* ══ PENUTUP — oranye tua ════════════════════════════════════ */}
      <AmbientSection tone="light" accent="ember" art={ART.flow} artOpacity={0.4} className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className={`${PANEL} flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10`}>
            <div className="max-w-xl">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">{t('cta.title')}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-500">{t('cta.subtitle')}</p>
            </div>
            <Link to="/contact"
              className={`inline-flex shrink-0 items-center justify-center rounded-lg px-7 py-3 text-[15px] font-semibold text-slate-900 transition-all hover:-translate-y-0.5 ${LIGHT.ember.button}`}>
              {t('cta.button')}
            </Link>
          </div>
        </div>
      </AmbientSection>

    </main>
  );
};

/* ─── sub-components ─────────────────────────────────────────────────────── */

const Figure = ({ value, label }) => (
  <div className="text-center">
    <dd className={`text-3xl font-bold tabular-nums tracking-tight ${LIGHT.blue.numeral}`}>{value}</dd>
    <div aria-hidden className={`mx-auto mt-2.5 h-px w-8 ${LIGHT.blue.rule}`} />
    <dt className="mt-2.5 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label}</dt>
  </div>
);

const DeptTab = ({ label, count, active, onClick }) => (
  <button onClick={onClick}
    className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-[15px] font-medium transition-colors ${
      active
        ? 'bg-orange-600 text-white shadow-sm'
        : 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 hover:text-slate-900'
    }`}>
    {label}
    <span className={`tabular-nums text-xs ${active ? 'text-orange-100' : 'text-slate-400'}`}>
      {count}
    </span>
  </button>
);

const EmptyState = ({ hasFilter, onReset, t }) => {
  const variant = hasFilter ? 'no_match' : 'no_data';
  return (
    <div className="rounded-xl border border-dashed border-slate-300 px-6 py-16 text-center">
      <p className="text-[15px] font-semibold text-slate-900">{t(`empty.${variant}.title`)}</p>
      <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-slate-500">
        {t(`empty.${variant}.subtitle`)}
      </p>
      {hasFilter && (
        <button onClick={onReset}
          className="mt-6 rounded-lg bg-white px-5 py-2.5 text-[15px] font-medium text-slate-700 ring-1 ring-slate-300 transition-colors hover:bg-slate-50">
          {t('filter.reset')}
        </button>
      )}
    </div>
  );
};

export default Teams;
