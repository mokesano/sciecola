import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  // Logika Cerdas: Tab "Journals" aktif jika di list atau di dalam profil jurnal
  const isJournalsActive = 
    location.pathname === '/journals' || 
    location.pathname.startsWith('/journals/');

  // Logika Cerdas: Tab "Researchers" aktif jika di list atau di dalam profil ORCID
  const isResearchersActive =
    location.pathname === '/researchers' || 
    location.pathname.startsWith('/orcid/');

  // Logika Cerdas: Tab "Articles" aktif jika di dalam profil artikel (berdasarkan DOI)  
  const isArticlesActive = 
    location.pathname === '/articles' || 
    location.pathname.startsWith('/doi/');  

  // Helper untuk styling agar kode tidak repetitif (Don't Repeat Yourself)
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
                WIZDAM
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
            
            {/* BERANDA */}
            <NavLink to="/" className="px-3 py-2 group">
              {({ isActive }) => (
                <span className={isActive ? activeClass : inactiveClass}>
                  Beranda
                </span>
              )}
            </NavLink>
            
            {/* JOURNALS (Placeholder) */}
            <NavLink to="/journals" className="px-3 py-2 group">
              {({ isActive }) => (
                <span className={isActive ? activeClass : inactiveClass}>
                  Journals
                </span>
              )}
            </NavLink>

            {/* RESEARCHERS (Logic Khusus) */}
            <NavLink to="/researchers" className="px-3 py-2 group">
              <span className={isResearchersActive ? activeClass : inactiveClass}>
                Researchers
              </span>
            </NavLink>

            {/* SDGS (Placeholder) */}
            <NavLink to="/sdgs" className="px-3 py-2 group">
              {({ isActive }) => (
                <span className={isActive ? activeClass : inactiveClass}>
                  SDGs
                </span>
              )}
            </NavLink>

            {/* ANALYTICS (Placeholder) */}
            <NavLink to="/analytics" className="px-3 py-2 group">
              {({ isActive }) => (
                <span className={isActive ? activeClass : inactiveClass}>
                  Analytics
                </span>
              )}
            </NavLink>

            {/* TENTANG (Placeholder) */}
            <NavLink to="/about" className="px-3 py-2 group">
              {({ isActive }) => (
                <span className={isActive ? activeClass : inactiveClass}>
                  Tentang
                </span>
              )}
            </NavLink>
          </div>

          {/* Bagian Kanan: Bahasa dan Tombol Login/Register */}
          <div className="flex items-center gap-3">
            
            {/* Locale Selector Dropdown */}
            <div className="relative group cursor-pointer hidden sm:block">
              <button className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-600 font-medium px-2 py-2 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span>ID</span>
                <svg className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className="absolute right-0 top-full mt-0 w-32 bg-white border border-gray-100 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                <div className="flex flex-col py-1">
                  <div className="px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50/50">
                    ID - Bahasa
                  </div>
                  <div className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600">
                    EN - English
                  </div>
                </div>
              </div>
            </div>

            <button className="text-indigo-600 font-medium px-4 py-2 rounded-xl hover:bg-indigo-50 transition-all">
              Masuk
            </button>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-medium shadow-md shadow-indigo-200 transition-all">
              Daftar
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;