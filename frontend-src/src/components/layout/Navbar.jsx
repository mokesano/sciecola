import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

// Bahasa yang didukung — data di-drive dari locale navbar.json
const SUPPORTED_LANGS = ['id', 'en'];

const Navbar = () => {
  const location  = useLocation();
  const { t, i18n } = useTranslation('navbar');
  const { user, logout } = useAuth();

  const [langOpen, setLangOpen]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const langRef = useRef(null);

  // Sync state lokal dengan nilai i18n saat ini
  const currentLang = SUPPORTED_LANGS.includes(i18n.language) ? i18n.language : 'id';

  const switchLang = useCallback((lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('sciecola_lang', lang);
    setLangOpen(false);
  }, [i18n]);

  // Tutup dropdown bahasa saat klik di luar
  useEffect(() => {
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Tutup menu mobile saat navigasi
  useEffect(() => { setMenuOpen(false); }, [location]);

  // Helpers active state
  const isResearchersActive = location.pathname === '/researchers' || location.pathname.startsWith('/orcid/');
  const isArticlesActive    = location.pathname === '/articles'    || location.pathname.startsWith('/doi/');

  const activeClass   = 'text-indigo-600 font-bold border-b-[4px] border-indigo-600 pb-6 transition-all';
  const inactiveClass = 'text-gray-500 group-hover:text-indigo-600 font-medium border-b-[4px] border-transparent group-hover:border-indigo-600 pb-6 transition-all';

  // Data bahasa dari locale — fallback inline jika namespace belum muat
  const langData = {
    id: t('lang.id', { returnObjects: true }),
    en: t('lang.en', { returnObjects: true }),
  };
  const activeLang = langData[currentLang] || { flag: '🌐', code: currentLang.toUpperCase(), country: currentLang };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* ── Logo ── */}
          <NavLink to="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="flex flex-col">
              <div className="text-indigo-600 text-3xl font-black group-hover:text-indigo-700 transition-colors">
                SCIECOLA
              </div>
              <div className="hidden md:block text-[10px] text-gray-500 font-semibold tracking-wider uppercase leading-none mt-1">
                {t('brand_tagline')}
              </div>
            </div>
          </NavLink>

          {/* ── Navigasi Desktop ── */}
          <div className="hidden lg:flex space-x-1">
            {[
              { to: '/',             label: t('nav.home'),        exact: true },
              { to: '/researchers',  label: t('nav.researchers'), active: isResearchersActive },
              { to: '/articles',     label: t('nav.articles'),    active: isArticlesActive },
              { to: '/sdgs',         label: t('nav.sdgs') },
              { to: '/analytics',    label: t('nav.analytics') },
              { to: '/teams',        label: t('nav.teams') },
              { to: '/about',        label: t('nav.about') },
            ].map(({ to, label, exact, active }) => (
              <NavLink key={to} to={to} end={exact} className="px-3 py-2 group">
                {({ isActive }) => (
                  <span className={(active !== undefined ? active : isActive) ? activeClass : inactiveClass}>
                    {label}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {/* ── Kanan: Language + Auth ── */}
          <div className="flex items-center gap-3">

            {/* ── Flag Language Picker ── */}
            <div ref={langRef} className="relative hidden sm:block">
              <button
                onClick={() => setLangOpen(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 font-medium transition-all text-sm"
                aria-label="Select language"
                aria-expanded={langOpen}
              >
                <span className="text-base leading-none">{activeLang.flag}</span>
                <span className="font-bold tracking-wide">{activeLang.code}</span>
                <span className="hidden md:inline text-gray-400">—</span>
                <span className="hidden md:inline">{activeLang.country}</span>
                <svg
                  className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50">
                  {SUPPORTED_LANGS.map((lang) => {
                    const ld = langData[lang] || { flag: '🌐', code: lang.toUpperCase(), country: lang };
                    const isActive = currentLang === lang;
                    return (
                      <button
                        key={lang}
                        onClick={() => switchLang(lang)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left font-medium transition-colors ${
                          isActive
                            ? 'text-indigo-600 bg-indigo-50'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                        }`}
                      >
                        <span className="text-lg leading-none">{ld.flag}</span>
                        <span>
                          <span className="font-bold">{ld.code}</span>
                          <span className="text-gray-400 font-normal"> — {ld.country}</span>
                        </span>
                        {isActive && (
                          <svg className="ml-auto w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Auth ── */}
            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/notifications" className="relative p-2 text-gray-500 hover:text-indigo-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </Link>
                <Link to="/my-profile" className="flex items-center gap-2 pl-3 border-l border-gray-200">
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=4f46e5&color=fff`}
                    alt={user.name || t('auth.profile')}
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    onError={(e) => { e.target.src = '/assets/img/researcher-default.svg'; }}
                  />
                  <span className="hidden md:block text-sm font-medium text-gray-700 hover:text-indigo-600 max-w-[120px] truncate">
                    {user.name || t('auth.profile')}
                  </span>
                </Link>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-medium shadow-md shadow-indigo-200 transition-all text-sm"
              >
                {t('auth.login')}
              </Link>
            )}

            {/* ── Mobile hamburger ── */}
            <button
              className="lg:hidden p-2 text-gray-500 hover:text-indigo-600 transition-colors"
              onClick={() => setMenuOpen(prev => !prev)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-3">
            {[
              { to: '/',            label: t('nav.home') },
              { to: '/researchers', label: t('nav.researchers') },
              { to: '/articles',    label: t('nav.articles') },
              { to: '/sdgs',        label: t('nav.sdgs') },
              { to: '/analytics',   label: t('nav.analytics') },
              { to: '/teams',       label: t('nav.teams') },
              { to: '/about',       label: t('nav.about') },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `block px-4 py-2.5 text-sm font-medium rounded-lg mx-1 transition-colors ${
                    isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}

            {/* Language switch in mobile menu */}
            <div className="flex gap-2 px-4 pt-3 mt-2 border-t border-gray-100">
              {SUPPORTED_LANGS.map((lang) => {
                const ld = langData[lang] || { flag: '🌐', code: lang.toUpperCase(), country: lang };
                return (
                  <button
                    key={lang}
                    onClick={() => switchLang(lang)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentLang === lang
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
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
