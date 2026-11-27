import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, User, BookOpen, Bookmark, BarChart3, Mail, Bell, Settings,
  Search, ArrowRight, Link2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import InitialsAvatar from '../shared/InitialsAvatar';
import { FeedStream } from '../../pages/Feeds';
import PartnerShowcase from '../premium/PartnerShowcase';

/**
 * Beranda pengguna yang masuk: kartu sambutan dengan angka pribadi, feed komunitas,
 * dan ringkasan platform. Semua angka berasal dari API:
 *  - /api/researcher_profile.php  → publikasi, sitasi, h-index (bila ORCID tertaut)
 *  - /api/notifications.php       → notifikasi belum dibaca
 *  - /api/messages.php            → pesan belum dibaca
 *  - /api/platform_stats.php      → angka platform dan SDG teratas
 * Nilai yang belum tersedia ditampilkan "—", tidak pernah angka contoh.
 */

const fmt = (v) => (v === null || v === undefined ? '—' : Number(v).toLocaleString());

const NAV = [
  { to: '/dashboard',      key: 'dashboard',     Icon: LayoutDashboard },
  { to: '/my-profile',     key: 'profile',       Icon: User },
  { to: '/my-articles',    key: 'articles',      Icon: BookOpen },
  { to: '/my-collections', key: 'collections',   Icon: Bookmark },
  { to: '/my-statistics',  key: 'statistics',    Icon: BarChart3 },
  { to: '/messages',       key: 'messages',      Icon: Mail },
  { to: '/notifications',  key: 'notifications', Icon: Bell },
  { to: '/settings',       key: 'settings',      Icon: Settings },
];

function greetingKey() {
  const h = new Date().getHours();
  if (h < 11) return 'morning';
  if (h < 15) return 'afternoon';
  if (h < 19) return 'evening';
  return 'night';
}

const getJson = (url) =>
  fetch(url, { credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))));

function QuickLookup({ t }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const v = q.trim();
    const orcid = v.match(/(?:orcid\.org\/)?(\d{4}-\d{4}-\d{4}-\d{3}[\dX])$/i);
    const doi = v.match(/(?:doi\.org\/)?(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i);
    if (orcid) return navigate(`/orcid/${orcid[1].toUpperCase()}`);
    if (doi) return navigate(`/doi/${encodeURIComponent(doi[1])}`);
    setErr(t('user_home.lookup.error'));
    return undefined;
  };
  return (
    <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 mb-1">{t('user_home.lookup.title')}</h3>
      <p className="text-sm text-gray-500 mb-3">{t('user_home.lookup.subtitle')}</p>
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setErr(''); }}
          placeholder={t('user_home.lookup.placeholder')}
          className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[15px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
      <button type="submit" className="mt-3 w-full py-2.5 bg-gray-900 text-white rounded-lg text-[15px] font-medium hover:bg-gray-800">
        {t('user_home.lookup.submit')}
      </button>
    </form>
  );
}

export default function UserHome() {
  const { t } = useTranslation('homepage');
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileState, setProfileState] = useState(user?.orcid ? 'loading' : 'no_orcid');
  const [unreadNotif, setUnreadNotif] = useState(null);
  const [unreadMsg, setUnreadMsg] = useState(null);
  const [platform, setPlatform] = useState(null);

  useEffect(() => {
    let alive = true;
    if (user?.orcid) {
      setProfileState('loading');
      getJson(`/api/researcher_profile.php?orcid=${encodeURIComponent(user.orcid)}`)
        .then((j) => {
          if (!alive) return;
          if (j.status === 'success' && j.profile) { setProfile(j.profile); setProfileState('ok'); } else setProfileState('error');
        })
        .catch(() => alive && setProfileState('error'));
    } else {
      setProfileState('no_orcid');
    }
    getJson('/api/notifications.php?count=1')
      .then((j) => alive && j.status === 'success' && setUnreadNotif(j.unread_count ?? 0))
      .catch(() => {});
    getJson('/api/messages.php?action=conversations')
      .then((j) => {
        if (!alive || !Array.isArray(j.conversations)) return;
        setUnreadMsg(j.conversations.reduce((sum, c) => sum + (Number(c.unread) || 0), 0));
      })
      .catch(() => {});
    getJson('/api/platform_stats.php')
      .then((j) => alive && j.status === 'success' && setPlatform(j))
      .catch(() => {});
    return () => { alive = false; };
  }, [user?.orcid]);

  const personal = profileState === 'ok' ? profile : null;
  const kpis = [
    { key: 'publications', value: personal?.publications, to: '/my-articles' },
    { key: 'citations',    value: personal?.citations,    to: '/my-statistics' },
    { key: 'hindex',       value: personal?.hIndex,       to: '/my-statistics' },
    { key: 'notifications', value: unreadNotif,           to: '/notifications' },
    { key: 'messages',     value: unreadMsg,              to: '/messages' },
  ];
  const firstName = (user?.name || '').trim().split(/\s+/)[0] || '';
  const summary = platform?.summary || {};
  const topSdgs = platform?.top_sdgs || [];

  return (
    <main className="pt-[76px] pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_300px] gap-6">

        {/* ── Kolom kiri: identitas & navigasi akun ─────────────────────── */}
        <aside className="hidden lg:block">
          <div className="sticky top-[84px] space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
              <InitialsAvatar src={user?.avatar} name={user?.name || 'U'} seed={user?.orcid || user?.email}
                className="w-16 h-16 rounded-full mx-auto" textClassName="text-xl" />
              <p className="mt-3 font-semibold text-gray-900 truncate">{user?.name}</p>
              {user?.orcid ? (
                <Link to={`/orcid/${user.orcid}`} className="text-sm text-gray-500 hover:text-indigo-600 font-mono">
                  {user.orcid}
                </Link>
              ) : (
                <Link to="/settings" className="inline-flex items-center gap-1 mt-1 text-sm font-medium text-indigo-600 hover:underline">
                  <Link2 className="w-3.5 h-3.5" /> {t('user_home.link_orcid')}
                </Link>
              )}
            </div>
            <nav className="bg-white rounded-xl border border-gray-200 shadow-sm p-2">
              {NAV.map(({ to, key, Icon }) => (
                <Link key={to} to={to}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-[15px] text-gray-700 hover:bg-gray-50 hover:text-indigo-700">
                  <Icon className="w-4 h-4 text-gray-400" />
                  <span className="flex-1">{t(`user_home.nav.${key}`)}</span>
                  {key === 'notifications' && unreadNotif > 0 && (
                    <span className="min-w-[20px] rounded-full bg-red-600 px-1.5 text-center text-xs font-bold leading-5 text-white">{unreadNotif}</span>
                  )}
                  {key === 'messages' && unreadMsg > 0 && (
                    <span className="min-w-[20px] rounded-full bg-indigo-600 px-1.5 text-center text-xs font-bold leading-5 text-white">{unreadMsg}</span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── Kolom tengah: kartu sambutan + feed ───────────────────────── */}
        <section className="min-w-0">
          <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-6 sm:p-7 mb-6 shadow-lg">
            <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-28 left-10 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="relative">
              <p className="text-sm text-slate-300">{t(`user_home.greeting.${greetingKey()}`)}</p>
              <h1 className="text-2xl sm:text-3xl font-bold mt-1">{firstName ? t('user_home.title', { name: firstName }) : t('user_home.title_plain')}</h1>
              <p className="text-slate-300 text-[15px] mt-2 max-w-xl">{t('user_home.subtitle')}</p>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
                {kpis.map((k) => (
                  <Link key={k.key} to={k.to}
                    className="rounded-xl bg-white/5 ring-1 ring-white/10 px-4 py-3 hover:bg-white/10 transition-colors">
                    <p className="text-xs uppercase tracking-wide text-slate-400">{t(`user_home.kpi.${k.key}`)}</p>
                    <p className="text-xl font-bold mt-1 tabular-nums">
                      {['publications', 'citations', 'hindex'].includes(k.key) && profileState === 'loading'
                        ? <span className="inline-block h-6 w-12 rounded bg-white/10 animate-pulse align-middle" />
                        : fmt(k.value)}
                    </p>
                  </Link>
                ))}
              </div>
              {profileState === 'no_orcid' && (
                <p className="mt-4 text-sm text-slate-300">
                  {t('user_home.no_orcid')}{' '}
                  <Link to="/settings" className="font-semibold text-orange-300 hover:underline">{t('user_home.link_orcid')}</Link>
                </p>
              )}
              {profileState === 'error' && (
                <p className="mt-4 text-sm text-slate-400">{t('user_home.profile_unavailable')}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">{t('user_home.feed_title')}</h2>
          </div>
          <FeedStream />
        </section>

        {/* ── Kolom kanan: ringkasan platform & pencarian cepat ─────────── */}
        <aside className="hidden xl:block">
          <div className="sticky top-[84px] space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{t('user_home.platform.title')}</h3>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {t('hero_panel.live')}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-3">
                {['articles', 'researchers', 'journals', 'citations'].map((k) => (
                  <div key={k} className="rounded-lg bg-gray-50 px-3 py-2.5">
                    <dt className="text-xs text-gray-500">{t(`hero_panel.kpi.${k}`)}</dt>
                    <dd className="text-lg font-bold text-gray-900 tabular-nums">{platform ? fmt(summary[k]) : '—'}</dd>
                  </div>
                ))}
              </dl>
              {topSdgs.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{t('hero_panel.top_sdgs')}</p>
                  <ul className="space-y-2">
                    {topSdgs.map((s) => (
                      <li key={s.sdg}>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700 truncate">SDG {s.sdg} · {s.name}</span>
                          <span className="text-gray-500 tabular-nums">{s.percentage}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 mt-1 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, s.percentage)}%`, backgroundColor: s.color }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Link to="/analytics" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
                {t('user_home.platform.cta')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <QuickLookup t={t} />
            <PartnerShowcase variant="sidebar" />
          </div>
        </aside>
      </div>
    </main>
  );
}
