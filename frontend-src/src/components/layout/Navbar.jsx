import React, { useState, useCallback } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const location = useLocation();
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language || 'id');

  const switchLang = useCallback((lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('sciecola_lang', lang);
    setCurrentLang(lang);
  }, [i18n]);

  // Mock: Ganti ini dengan state auth yang sebenarnya dari Context/Redux
  const isAuthenticated = false; 

  // Logika Cerdas: Tab aktif berdasarkan pathname
  const isJournalsActive = location.pathname === '/journals' || location.pathname.startsWith('/journal/');
  const isResearchersActive = location.pathname === '/researchers' || location.pathname.startsWith('/orcid/');
  const isArticlesActive = location.pathname === '/articles' || location.pathname.startsWith('/doi/');

  // Helper styling (DRY Principle)
  const activeClass = "text-indigo-600 font-bold border-b-[4px] border-indigo-600 pb-6 transition-all";
  const inactiveClass = "text-gray-500 group-hover:text-indigo-600 font-medium border-b-[4px] border-transparent group-hover:border-indigo-600 pb-6 transition-all";

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Bagian Kiri: Logo dan Judul */}
          <NavLink to="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="flex flex-col">
              <div className="text-indigo-600 text-3xl font-black group-hover:text-indigo-700 transition-colors">
                SCIECOLA
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase leading-none mt-1">
                  SDGs Classification & Analytics
                </span>
              </div>
            </div>
          </NavLink>
          
          {/* Bagian Tengah: Menu Navigasi */}
          <div className="hidden lg:flex space-x-1 mt-1">
            <NavLink to="/" className="px-3 py-2 group">
              {({ isActive }) => <span className={isActive ? activeClass : inactiveClass}>Beranda</span>}
            </NavLink>
            
            <NavLink to="/researchers" className="px-3 py-2 group">
              <span className={isResearchersActive ? activeClass : inactiveClass}>Researchers</span>
            </NavLink>

            <NavLink to="/articles" className="px-3 py-2 group">
              {({ isActive }) => <span className={isActive ? activeClass : inactiveClass}>Articles</span>}
            </NavLink>

            <NavLink to="/sdgs" className="px-3 py-2 group">
              {({ isActive }) => <span className={isActive ? activeClass : inactiveClass}>SDGs</span>}
            </NavLink>

            <NavLink to="/analytics" className="px-3 py-2 group">
              {({ isActive }) => <span className={isActive ? activeClass : inactiveClass}>Analytics</span>}
            </NavLink>

            <NavLink to="/teams" className="px-3 py-2 group">
              {({ isActive }) => <span className={isActive ? activeClass : inactiveClass}>Teams</span>}
            </NavLink>

            <NavLink to="/about" className="px-3 py-2 group">
              {({ isActive }) => <span className={isActive ? activeClass : inactiveClass}>About</span>}
            </NavLink>
          </div>

          {/* Bagian Kanan: Bahasa dan Tombol Auth */}
          <div className="flex items-center gap-3">
            
            {/* Locale Selector Dropdown */}
            <div className="relative group cursor-pointer hidden sm:block">
              <button className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-600 font-medium px-2 py-2 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span className="uppercase text-sm font-bold">{currentLang}</span>
                <svg className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className="absolute right-0 top-full mt-0 w-36 bg-white border border-gray-100 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                <div className="flex flex-col py-1">
                  <button
                    onClick={() => switchLang('id')}
                    className={`px-4 py-2 text-sm text-left font-medium transition-colors ${currentLang === 'id' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'}`}
                  >
                    ID — Bahasa
                  </button>
                  <button
                    onClick={() => switchLang('en')}
                    className={`px-4 py-2 text-sm text-left font-medium transition-colors ${currentLang === 'en' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'}`}
                  >
                    EN — English
                  </button>
                </div>
              </div>
            </div>

            {/* Conditional Rendering: Auth Buttons vs User Menu */}
            {!isAuthenticated ? (
              <>
                {/* Tombol Login */}
                <Link 
                  to="/login?register=true" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-medium shadow-md shadow-indigo-200 transition-all"
                >
                  Login
                </Link>
              </>
            ) : (
              // Tampilan jika sudah login (User Menu)
              <div className="flex items-center gap-3">
                <Link to="/notifications" className="relative p-2 text-gray-500 hover:text-indigo-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </Link>
                
                <Link to="/my-profile" className="flex items-center gap-2 pl-3 border-l border-gray-200">
                  <img 
                    src="https://i.pravatar.cc/150?img=11" 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover border border-gray-200" 
                  />
                  <span className="hidden md:block text-sm font-medium text-gray-700 hover:text-indigo-600">Andi Rahman</span>
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;