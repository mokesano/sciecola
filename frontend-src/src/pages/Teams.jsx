import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

/* ─── helpers ────────────────────────────────────────────────────────────── */

function getInitials(name) {
  return (name ?? '').replace(/^(Dr\.|Prof\.|Drs\.|Ir\.)\s+/i, '')
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map(w => w[0]).join('').toUpperCase();
}

/* ─── avatar with fallback ───────────────────────────────────────────────── */
const Avatar = ({ photo, name }) => {
  const [err, setErr] = useState(false);
  if (photo && !err) {
    return (
      <img src={photo} alt={name} onError={() => setErr(true)}
        className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-indigo-50 group-hover:border-indigo-200 transition-colors" />
    );
  }
  return (
    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xl font-bold flex items-center justify-center border-4 border-indigo-50 group-hover:border-indigo-200 transition-colors">
      {getInitials(name)}
    </div>
  );
};

/* ─── member card ────────────────────────────────────────────────────────── */
const MemberCard = ({ member, t }) => (
  <Link to={`/teams/${member.slug}`}
    className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all text-center group block">
    <div className="mb-4 relative inline-block">
      <Avatar photo={member.photo} name={member.name} />
    </div>
    {member.code && <p className="text-[10px] font-mono text-gray-300 mb-0.5">{member.code}</p>}
    <h3 className="font-bold text-gray-900 mb-1 text-sm leading-tight group-hover:text-indigo-700 transition-colors">{member.name}</h3>
    <p className="text-xs text-indigo-600 font-medium mb-1">{member.position}</p>
    {member.department && (
      <p className="text-[11px] text-gray-500 mb-2">{member.department}</p>
    )}
    {member.location && (
      <p className="text-[11px] text-gray-400 mb-3 line-clamp-1">{member.location}</p>
    )}
    <span className="inline-block text-xs text-indigo-500 font-medium group-hover:underline">
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
    <>
      <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link to="/"      className="hover:text-indigo-600 transition-colors">{t('breadcrumb.home')}</Link>
          <span className="text-gray-400">›</span>
          <Link to="/about" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.about')}</Link>
          <span className="text-gray-400">›</span>
          <span className="text-gray-900 font-medium">{t('breadcrumb.current')}</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">{t('header.title')}</h1>
          <p className="text-lg text-gray-600 max-w-3xl">{t('header.subtitle')}</p>
          <p className="text-xs text-gray-400 mt-3 italic">{t('admin_note')}</p>
        </div>

        {/* Stats */}
        {!loading && !error && members.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-10 max-w-2xl">
            <StatChip value={members.length}      label={t('stats.members')}     accent="indigo" />
            <StatChip value={departments.length}  label={t('stats.departments')} accent="purple" />
            <StatChip value={countries}           label={t('stats.countries')}   accent="emerald" />
          </div>
        )}

        {/* Filters */}
        {!loading && !error && members.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <div className="relative flex-1 max-w-md">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t('filter.search')}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex flex-wrap gap-2">
              <DeptPill name="all" label={t('filter.all')} count={members.length}
                active={activeDept === 'all'} onClick={() => setActiveDept('all')} />
              {departments.map(d => (
                <DeptPill key={d.id} name={d.name} label={d.name}
                  count={deptCounts[d.name] ?? 0}
                  active={activeDept === d.name}
                  onClick={() => setActiveDept(d.name)} />
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            {t('loading')}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center gap-3 py-16">
            <p className="text-red-600 font-medium">{t('error')}</p>
            <button onClick={fetchData}
              className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors">
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
            <div className="space-y-12">
              {Object.entries(grouped).map(([deptName, list]) => (
                <section key={deptName}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-1 h-6 bg-indigo-500 rounded-full" />
                    <h2 className="text-lg font-bold text-gray-900">{deptName}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700">
                      {list.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {list.map(m => <MemberCard key={m.id} member={m} t={t} />)}
                  </div>
                </section>
              ))}
            </div>
          )
        )}

        {/* CTA */}
        <section className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">{t('cta.title')}</h3>
              <p className="text-indigo-100 max-w-xl">{t('cta.subtitle')}</p>
            </div>
            <Link to="/contact"
              className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap flex items-center gap-2">
              {t('cta.button')}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </section>

      </main>
    </>
  );
};

/* ─── sub-components ─────────────────────────────────────────────────────── */

const StatChip = ({ value, label, accent }) => {
  const colorCls = { indigo:'text-indigo-600', purple:'text-purple-600', emerald:'text-emerald-600' }[accent] ?? 'text-gray-700';
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
      <p className={`text-2xl font-bold ${colorCls}`}>{value}</p>
      <p className="text-xs text-gray-600 mt-1">{label}</p>
    </div>
  );
};

const DeptPill = ({ label, count, active, onClick }) => (
  <button onClick={onClick}
    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
      active
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
    }`}>
    {label}
    <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-white/25' : 'bg-gray-100 text-gray-500'}`}>
      {count}
    </span>
  </button>
);

const EmptyState = ({ hasFilter, onReset, t }) => {
  const variant = hasFilter ? 'no_match' : 'no_data';
  return (
    <div className="flex flex-col items-center py-20 gap-3">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <p className="font-semibold text-gray-800">{t(`empty.${variant}.title`)}</p>
      <p className="text-sm text-gray-500 text-center max-w-sm">{t(`empty.${variant}.subtitle`)}</p>
      {hasFilter && (
        <button onClick={onReset}
          className="mt-1 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
          Reset
        </button>
      )}
    </div>
  );
};

export default Teams;
