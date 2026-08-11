import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

/* ─── helpers ────────────────────────────────────────────────────────────── */

function getInitials(name) {
  return (name ?? '').replace(/^(Dr\.|Prof\.|Drs\.|Ir\.)\s+/i, '')
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map(w => w[0]).join('').toUpperCase();
}

/* ─── avatar with gradient ring + fallback ───────────────────────────────── */
const Avatar = ({ photo, name }) => {
  const [err, setErr] = useState(false);
  const showImage = photo && !err;
  return (
    // The ring is a gradient sheet with the avatar sitting on a white inset,
    // so the ring reads as a stroke rather than a filled circle.
    <div className="relative mx-auto w-[6.5rem] h-[6.5rem] rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 p-[3px] transition-transform duration-300 group-hover:scale-105">
      <div className="w-full h-full rounded-full bg-white p-[3px]">
        {showImage ? (
          <img src={photo} alt={name} onError={() => setErr(true)}
            className="w-full h-full rounded-full object-cover" />
        ) : (
          <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xl font-bold flex items-center justify-center tracking-wide">
            {getInitials(name)}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── member card ────────────────────────────────────────────────────────── */
const MemberCard = ({ member, t }) => {
  const expertise = member.expertise ?? [];
  return (
    <Link
      to={`/teams/${member.slug}`}
      className="group relative flex flex-col items-center overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10"
    >
      {/* Wash that fades in on hover — keeps the resting state calm. */}
      <div className="pointer-events-none absolute inset-x-0 -top-16 h-40 bg-gradient-to-b from-indigo-50 via-indigo-50/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative mb-4">
        <Avatar photo={member.photo} name={member.name} />
      </div>

      <div className="relative flex-1 w-full">
        {member.code && (
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-gray-300">{member.code}</p>
        )}
        <h3 className="text-base font-bold leading-snug text-gray-900 transition-colors group-hover:text-indigo-700">
          {member.name}
        </h3>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">{member.position}</p>

        {member.department && (
          <p className="mt-2 text-[11px] text-gray-500">{member.department}</p>
        )}
        {member.location && (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-400">{member.location}</p>
        )}

        {expertise.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {expertise.slice(0, 2).map((e, i) => (
              <span key={i} className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600">
                {e}
              </span>
            ))}
            {expertise.length > 2 && (
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-600">
                +{expertise.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      <span className="relative mt-5 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600">
        {t('card.view_profile')}
        <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </span>
    </Link>
  );
};

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

  /* Group by department for display */
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
    <main className="relative w-full overflow-hidden pb-20 pt-28">
      {/* Ambient gradient blobs behind the hero. Purely decorative. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="absolute -top-24 right-1/4 h-80 w-80 rounded-full bg-fuchsia-300/25 blur-3xl" />
        <div className="absolute top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-300/20 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-gray-600">
          <Link to="/"      className="transition-colors hover:text-indigo-600">{t('breadcrumb.home')}</Link>
          <span className="text-gray-300">›</span>
          <Link to="/about" className="transition-colors hover:text-indigo-600">{t('breadcrumb.about')}</Link>
          <span className="text-gray-300">›</span>
          <span className="font-medium text-gray-900">{t('breadcrumb.current')}</span>
        </nav>

        {/* Hero */}
        <header className="mb-12 max-w-3xl">
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-gray-900 lg:text-5xl">
            {t('header.title')}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-gray-600">{t('header.subtitle')}</p>
          <p className="mt-4 text-xs italic text-gray-400">{t('admin_note')}</p>
        </header>

        {/* Stats */}
        {!loading && !error && members.length > 0 && (
          <div className="mb-10 grid max-w-3xl grid-cols-3 gap-4">
            <StatChip value={members.length}     label={t('stats.members')}     accent="indigo" />
            <StatChip value={departments.length} label={t('stats.departments')} accent="violet" />
            <StatChip value={countries}          label={t('stats.countries')}   accent="emerald" />
          </div>
        )}

        {/* Filters — sticks below the navbar so filtering stays reachable
            while scrolling a long roster. */}
        {!loading && !error && members.length > 0 && (
          <div className="sticky top-20 z-30 -mx-4 mb-12 border-y border-gray-200/70 bg-white/75 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-xs">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('filter.search')}
                  className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                />
                <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="-mx-1 flex flex-1 gap-2 overflow-x-auto px-1 pb-1 sm:pb-0">
                <DeptPill label={t('filter.all')} count={members.length}
                  active={activeDept === 'all'} onClick={() => setActiveDept('all')} />
                {departments.map(d => (
                  <DeptPill key={d.id} label={d.name}
                    count={deptCounts[d.name] ?? 0}
                    active={activeDept === d.name}
                    onClick={() => setActiveDept(d.name)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-24 text-gray-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            {t('loading')}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-medium text-red-600">{t('error')}</p>
            <button onClick={fetchData}
              className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800">
              {t('retry')}
            </button>
          </div>
        )}

        {/* Members */}
        {!loading && !error && (
          filtered.length === 0 ? (
            <EmptyState hasFilter={hasFilter} t={t}
              onReset={() => { setActiveDept('all'); setSearch(''); }} />
          ) : (
            <div className="space-y-14">
              {Object.entries(grouped).map(([deptName, list]) => (
                <section key={deptName}>
                  <div className="mb-6 flex items-center gap-4">
                    <h2 className="whitespace-nowrap text-lg font-bold tracking-tight text-gray-900">{deptName}</h2>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                      {list.length}
                    </span>
                    {/* Rule fills the remaining width and fades out. */}
                    <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {list.map(m => <MemberCard key={m.id} member={m} t={t} />)}
                  </div>
                </section>
              ))}
            </div>
          )
        )}

        {/* CTA */}
        <section className="relative mt-20 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-8 text-white shadow-xl shadow-indigo-500/20 sm:p-10">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('cta.title')}</h3>
              <p className="mt-2 max-w-xl text-indigo-100">{t('cta.subtitle')}</p>
            </div>
            <Link to="/contact"
              className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-7 py-3 font-semibold text-indigo-700 shadow-lg transition-transform hover:scale-[1.03]">
              {t('cta.button')}
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
};

/* ─── sub-components ─────────────────────────────────────────────────────── */

const StatChip = ({ value, label, accent }) => {
  const grad = {
    indigo:  'from-indigo-500 to-blue-500',
    violet:  'from-violet-500 to-fuchsia-500',
    emerald: 'from-emerald-500 to-teal-500',
  }[accent] ?? 'from-gray-500 to-gray-600';
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white/80 p-5 backdrop-blur-sm">
      <p className={`bg-gradient-to-br ${grad} bg-clip-text text-3xl font-bold tabular-nums text-transparent`}>
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
};

const DeptPill = ({ label, count, active, onClick }) => (
  <button onClick={onClick}
    className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
      active
        ? 'bg-gray-900 text-white shadow-md'
        : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
    }`}>
    {label}
    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
      active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
    }`}>
      {count}
    </span>
  </button>
);

const EmptyState = ({ hasFilter, onReset, t }) => {
  const variant = hasFilter ? 'no_match' : 'no_data';
  return (
    <div className="flex flex-col items-center gap-3 py-24">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 text-gray-400 ring-1 ring-gray-200/70">
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <p className="mt-1 font-semibold text-gray-800">{t(`empty.${variant}.title`)}</p>
      <p className="max-w-sm text-center text-sm text-gray-500">{t(`empty.${variant}.subtitle`)}</p>
      {hasFilter && (
        <button onClick={onReset}
          className="mt-2 rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800">
          {t('filter.reset')}
        </button>
      )}
    </div>
  );
};

export default Teams;
