import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Menu, X, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Bahasa yang didukung — data di-drive dari locale navbar.json
const SUPPORTED_LANGS = ['id', 'en'];

/*
 * Kelompok menu. Rutenya di sini, labelnya di locale — jadi tidak ada teks
 * yang ter-hardcode dan satu kelompok bisa ditambah tanpa menyentuh markup.
 * Pengelompokannya mengikuti bagaimana aplikasinya benar-benar terbagi, bukan
 * urutan rute di router.
 */
const MENU = [
  { key: 'research', items: [
      { key: 'researchers',  to: '/researchers' },
      { key: 'articles',     to: '/articles' },
      { key: 'journals',     to: '/journals' },
      { key: 'institutions', to: '/institutions' },
  ]},
  { key: 'sdg', items: [
      { key: 'explorer',     to: '/sdgs' },
      { key: 'impact',       to: '/article-impact' },
      { key: 'distribution', to: '/researcher-distribution' },
  ]},
  { key: 'analytics', items: [
      { key: 'dashboard',   to: '/analytics' },
      { key: 'trends',      to: '/trends-analysis' },
      { key: 'insights',    to: '/insights' },
      { key: 'leaderboard', to: '/leaderboard' },
  ]},
  { key: 'collab', items: [
      { key: 'matching',    to: '/research-matching' },
      { key: 'projects',    to: '/projects' },
      { key: 'marketplace', to: '/innovation-marketplace' },
      { key: 'sponsor',     to: '/become-sponsor' },
  ]},
  { key: 'about', items: [
      { key: 'about',    to: '/about' },
      { key: 'teams',    to: '/teams' },
      { key: 'partners', to: '/partners' },
      { key: 'docs',     to: '/docs/documentation' },
      { key: 'api',      to: '/docs/api-reference' },
      { key: 'contact',  to: '/contact' },
  ]},
];

const Navbar = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation('navbar');
  const { user, logout } = useAuth();

  const [langOpen, setLangOpen]       = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [openGroup, setOpenGroup]     = useState(null);
  const [mobileGroup, setMobileGroup] = useState(null);
  const langRef = useRef(null);
  const navRef  = useRef(null);

  const currentLang = SUPPORTED_LANGS.includes(i18n.language) ? i18n.language : 'id';

  const switchLang = useCallback((lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('sciecola_lang', lang);
    setLangOpen(false);
  }, [i18n]);

  /* Satu pengait untuk menutup apa pun yang sedang terbuka saat klik jatuh di
     luar wilayahnya, plus Escape. Dua listener terpisah akan saling menimpa. */
  useEffect(() => {
    const onDown = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (navRef.current  && !navRef.current.contains(e.target))  setOpenGroup(null);
    };
    const onEsc = (e) => {
      if (e.key !== 'Escape') return;
      setLangOpen(false); setOpenGroup(null); setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  // Tutup semua yang terbuka saat navigasi
  useEffect(() => {
    setMenuOpen(false); setOpenGroup(null); setMobileGroup(null);
  }, [location]);

  /* Sebuah kelompok menyala bila salah satu rutenya sedang dibuka — termasuk
     rute turunannya, supaya /orcid/xxx dan /doi/xxx tetap menyalakan Riset. */
  const groupIsActive = (group) =>
    group.items.some(it => location.pathname === it.to || location.pathname.startsWith(`${it.to}/`))
    || (group.key === 'research' &&
        (location.pathname.startsWith('/orcid/') || location.pathname.startsWith('/doi/')));

  const langData = {
    id: t('lang.id', { returnObjects: true }),
    en: t('lang.en', { returnObjects: true }),
  };
  const activeLang = langData[currentLang]
    || { flag: '🌐', code: currentLang.toUpperCase(), country: currentLang };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
      {/* Padding tepinya disamakan dengan pembungkus isi halaman, supaya
          wordmark dan menu sejajar dengan tepi seksi di bawahnya. */}
      <div className="mx-auto w-full px-6 sm:px-10 lg:px-14 xl:px-20 2xl:px-28">
        {/* Bilah dipendekkan dari 80px ke 60px. Kedalaman navigasi sekarang
            dipikul menu turunannya, jadi bilahnya sendiri tidak perlu
            setinggi itu — dan isi halaman naik 20px. */}
        <div className="flex h-[60px] items-center justify-between">

          <NavLink to="/" className="group flex shrink-0 items-center">
            <span className="text-2xl font-black text-orange-600 transition-colors group-hover:text-orange-700">
              SCIECOLA
            </span>
          </NavLink>

          {/* ── Navigasi desktop ── */}
          <div ref={navRef} className="hidden items-center gap-1 lg:flex">
            <NavLink to="/" end
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-[15px] font-medium transition-colors ${
                  isActive ? 'text-orange-700' : 'text-slate-600 hover:bg-orange-50 hover:text-orange-700'
                }`
              }>
              {t('menu.home')}
            </NavLink>

            {MENU.map((group) => {
              const open   = openGroup === group.key;
              const active = groupIsActive(group);
              return (
                <div key={group.key} className="relative">
                  <button type="button"
                    onClick={() => setOpenGroup(open ? null : group.key)}
                    aria-expanded={open}
                    aria-haspopup="true"
                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-[15px] font-medium transition-colors ${
                      active || open
                        ? 'bg-orange-50 text-orange-700'
                        : 'text-slate-600 hover:bg-orange-50 hover:text-orange-700'
                    }`}>
                    {t(`menu.groups.${group.key}.label`)}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                  </button>

                  {open && (
                    <div className="absolute left-0 top-full z-50 mt-1.5 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                      {group.items.map((item) => (
                        <NavLink key={item.to} to={item.to}
                          className={({ isActive }) =>
                            `block px-4 py-2.5 text-[15px] transition-colors ${
                              isActive
                                ? 'bg-orange-50 font-semibold text-orange-700'
                                : 'text-slate-600 hover:bg-orange-50 hover:text-orange-700'
                            }`
                          }>
                          {t(`menu.groups.${group.key}.items.${item.key}`)}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Kanan: bahasa + auth ── */}
          <div className="flex items-center gap-2">

            <div ref={langRef} className="relative hidden sm:block">
              <button
                onClick={() => setLangOpen(prev => !prev)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[15px] font-medium text-slate-600 transition-colors hover:bg-orange-50 hover:text-orange-700"
                aria-label="Select language"
                aria-expanded={langOpen}
              >
                <span className="text-base leading-none">{activeLang.flag}</span>
                <span className="font-bold tracking-wide">{activeLang.code}</span>
                <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
              </button>

              {langOpen && (
                <div className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  {SUPPORTED_LANGS.map((lang) => {
                    const ld = langData[lang] || { flag: '🌐', code: lang.toUpperCase(), country: lang };
                    const isActive = currentLang === lang;
                    return (
                      <button key={lang} onClick={() => switchLang(lang)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] font-medium transition-colors ${
                          isActive ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-orange-50 hover:text-orange-700'
                        }`}>
                        <span className="text-lg leading-none">{ld.flag}</span>
                        <span>
                          <span className="font-bold">{ld.code}</span>
                          <span className="font-normal text-slate-400"> — {ld.country}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/notifications"
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-orange-50 hover:text-orange-700">
                  <Bell className="h-5 w-5" />
                </Link>
                <Link to="/my-profile" className="flex items-center gap-2 border-l border-slate-200 pl-2">
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=ea580c&color=fff`}
                    alt={user.name || t('auth.profile')}
                    className="h-8 w-8 rounded-full border border-slate-200 object-cover"
                    onError={(e) => { e.target.src = '/assets/img/researcher-default.svg'; }}
                  />
                  <span className="hidden max-w-[120px] truncate text-[15px] font-medium text-slate-700 md:block">
                    {user.name || t('auth.profile')}
                  </span>
                </Link>
                <button onClick={logout}
                  className="hidden rounded-lg px-3 py-2 text-[15px] font-medium text-slate-500 transition-colors hover:bg-orange-50 hover:text-orange-700 md:block">
                  {t('auth.logout', 'Keluar')}
                </button>
              </div>
            ) : (
              <Link to="/login"
                className="rounded-lg bg-orange-600 px-5 py-2 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-orange-700">
                {t('auth.login')}
              </Link>
            )}

            <button
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-orange-50 hover:text-orange-700 lg:hidden"
              onClick={() => setMenuOpen(prev => !prev)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* ── Menu mobile: kelompok yang sama, dilipat ── */}
        {menuOpen && (
          <div className="max-h-[70vh] overflow-y-auto border-t border-slate-200 py-3 lg:hidden">
            <NavLink to="/" end
              className="block rounded-lg px-4 py-2.5 text-[15px] font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-700">
              {t('menu.home')}
            </NavLink>

            {MENU.map((group) => {
              const open = mobileGroup === group.key;
              return (
                <div key={group.key}>
                  <button type="button"
                    onClick={() => setMobileGroup(open ? null : group.key)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-[15px] font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-700">
                    {t(`menu.groups.${group.key}.label`)}
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <div className="mb-1 ml-3 border-l border-slate-200 pl-3">
                      {group.items.map((item) => (
                        <NavLink key={item.to} to={item.to}
                          className={({ isActive }) =>
                            `block rounded-lg px-4 py-2 text-[15px] transition-colors ${
                              isActive ? 'font-semibold text-orange-700' : 'text-slate-600 hover:text-orange-700'
                            }`
                          }>
                          {t(`menu.groups.${group.key}.items.${item.key}`)}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="mt-2 flex gap-2 border-t border-slate-200 px-4 pt-3">
              {SUPPORTED_LANGS.map((lang) => {
                const ld = langData[lang] || { flag: '🌐', code: lang.toUpperCase() };
                return (
                  <button key={lang} onClick={() => switchLang(lang)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[15px] font-medium transition-colors ${
                      currentLang === lang
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-700'
                    }`}>
                    <span>{ld.flag}</span>
                    <span>{ld.code}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
