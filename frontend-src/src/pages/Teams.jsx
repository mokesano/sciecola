import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

/* ─── helpers ────────────────────────────────────────────────────────────── */

function getInitials(name) {
  return (name ?? '').replace(/^(Dr\.|Prof\.|Drs\.|Ir\.)\s+/i, '')
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map(w => w[0]).join('').toUpperCase();
}

/* ─── portrait ───────────────────────────────────────────────────────────── */
/* Circular, greyscale at rest and colour on hover — the convention used on
   OpenAIRE's board pages. Greyscale evens out portraits shot under wildly
   different lighting, which is what a real roster always looks like. */
const Portrait = ({ photo, name }) => {
  const [err, setErr] = useState(false);
  const showImage = photo && !err;
  return (
    <div className="mx-auto h-32 w-32 overflow-hidden rounded-full border border-slate-200 bg-slate-50 shadow-sm ring-4 ring-white">
      {showImage ? (
        <img src={photo} alt={name} onError={() => setErr(true)}
          className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-2xl font-medium tracking-wide text-slate-400">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
};

/* ─── member record ──────────────────────────────────────────────────────── */
const MemberCard = ({ member, t }) => (
  <Link to={`/teams/${member.slug}`} className="group flex flex-col items-center px-2 text-center">
    <Portrait photo={member.photo} name={member.name} />

    <h3 className="mt-5 text-[15px] font-semibold leading-snug text-slate-900 group-hover:text-indigo-700">
      {member.name}
    </h3>

    {member.department && (
      <p className="mt-1.5 text-[13px] leading-snug text-slate-500">{member.department}</p>
    )}
    {member.location && (
      <p className="text-[13px] leading-snug text-slate-500">{member.location}</p>
    )}

    {/* Role sits last and in the accent colour, the way a board page marks
        "Chair" — it is the distinguishing fact, not the affiliation. */}
    {member.position && (
      <p className="mt-2 text-[13px] font-medium text-indigo-700">{member.position}</p>
    )}

    <span className="mt-2 text-xs text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
      {t('card.view_profile')}
    </span>
  </Link>
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
    <main className="w-full pb-24 pt-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="mb-10 flex items-center gap-2 text-[13px] text-slate-500">
          <Link to="/"      className="hover:text-indigo-700 hover:underline">{t('breadcrumb.home')}</Link>
          <span className="text-slate-300">/</span>
          <Link to="/about" className="hover:text-indigo-700 hover:underline">{t('breadcrumb.about')}</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700">{t('breadcrumb.current')}</span>
        </nav>

        {/* Masthead — centred, the way a board or governance page opens. */}
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-700">
            {t('breadcrumb.current')}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-slate-900 lg:text-5xl">
            {t('header.title')}
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-slate-600">
            {t('header.subtitle')}
          </p>
        </header>

        {/* Key figures */}
        {!loading && !error && members.length > 0 && (
          <dl className="mx-auto mt-12 grid max-w-2xl grid-cols-3 divide-x divide-slate-200 border-y border-slate-200">
            <Figure value={members.length}     label={t('stats.members')} />
            <Figure value={departments.length} label={t('stats.departments')} />
            <Figure value={countries}          label={t('stats.countries')} />
          </dl>
        )}

        {/* Filters — sticks below the navbar so filtering stays reachable
            while scrolling a long roster. */}
        {!loading && !error && members.length > 0 && (
          <div className="sticky top-20 z-30 -mx-4 mt-2 border-b border-slate-200 bg-white px-4 py-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-xs">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('filter.search')}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:pb-0">
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
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-24 text-sm text-slate-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
            {t('loading')}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mt-10 rounded-lg border border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-900">{t('error')}</p>
            <button onClick={fetchData}
              className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400">
              {t('retry')}
            </button>
          </div>
        )}

        {/* Roster */}
        {!loading && !error && (
          filtered.length === 0 ? (
            <EmptyState hasFilter={hasFilter} t={t}
              onReset={() => { setActiveDept('all'); setSearch(''); }} />
          ) : (
            <div className="mt-16 space-y-20">
              {Object.entries(grouped).map(([deptName, list]) => (
                <section key={deptName}>
                  <div className="mb-12 text-center">
                    <h2 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">
                      {deptName}
                    </h2>
                    <div aria-hidden className="mx-auto mt-3 h-px w-10 bg-indigo-600" />
                    <p className="mt-3 text-[13px] tabular-nums text-slate-400">{list.length}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
                    {list.map(m => <MemberCard key={m.id} member={m} t={t} />)}
                  </div>
                </section>
              ))}
            </div>
          )
        )}

        {/* Governance note */}
        {!loading && !error && members.length > 0 && (
          <p className="mt-16 border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
            {t('admin_note')}
          </p>
        )}

        {/* Enquiries */}
        <section className="mt-16 rounded-lg bg-slate-900 px-6 py-10 text-white sm:px-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h3 className="font-serif text-2xl font-semibold tracking-tight">{t('cta.title')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{t('cta.subtitle')}</p>
            </div>
            <Link to="/contact"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100">
              {t('cta.button')}
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
};

/* ─── sub-components ─────────────────────────────────────────────────────── */

const Figure = ({ value, label }) => (
  <div className="px-4 py-6 text-center">
    <dd className="text-3xl font-semibold tabular-nums tracking-tight text-slate-900">{value}</dd>
    <div aria-hidden className="mx-auto mt-2.5 h-px w-8 bg-indigo-600" />
    <dt className="mt-2.5 text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">{label}</dt>
  </div>
);

const DeptTab = ({ label, count, active, onClick }) => (
  <button onClick={onClick}
    className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors ${
      active
        ? 'border-slate-900 bg-slate-900 text-white'
        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
    }`}>
    {label}
    <span className={`tabular-nums text-[11px] ${active ? 'text-slate-300' : 'text-slate-400'}`}>
      {count}
    </span>
  </button>
);

const EmptyState = ({ hasFilter, onReset, t }) => {
  const variant = hasFilter ? 'no_match' : 'no_data';
  return (
    <div className="mt-16 rounded-lg border border-dashed border-slate-300 px-6 py-16 text-center">
      <p className="text-sm font-semibold text-slate-900">{t(`empty.${variant}.title`)}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">
        {t(`empty.${variant}.subtitle`)}
      </p>
      {hasFilter && (
        <button onClick={onReset}
          className="mt-5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400">
          {t('filter.reset')}
        </button>
      )}
    </div>
  );
};

export default Teams;
