import React from 'react';

const Navbar = () => {
  return (
    // Navbar menempel di atas (fixed) dengan efek blur transparan
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Bagian Kiri: Logo dan Judul */}
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="text-indigo-600 text-3xl font-black">
              WIZDAM
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase leading-none mt-1">
                SDGs Classification & Analytics
              </span>
            </div>
          </div>
          
          {/* Bagian Tengah: Menu Navigasi (Sembunyi di HP, Tampil di Desktop) */}
          <div className="hidden lg:flex space-x-1">
            <a href="#" className="px-4 py-2 text-indigo-600 font-bold border-b-2 border-indigo-600">Beranda</a>
            <a href="#" className="px-4 py-2 text-gray-500 hover:text-indigo-600 font-medium transition-colors">Journals</a>
            <a href="#" className="px-4 py-2 text-gray-500 hover:text-indigo-600 font-medium transition-colors">Researchers</a>
            <a href="#" className="px-4 py-2 text-gray-500 hover:text-indigo-600 font-medium transition-colors">SDGs</a>
            <a href="#" className="px-4 py-2 text-gray-500 hover:text-indigo-600 font-medium transition-colors">Analytics</a>
            <a href="#" className="px-4 py-2 text-gray-500 hover:text-indigo-600 font-medium transition-colors">Tentang</a>
            <a href="#" className="px-4 py-2 text-gray-500 hover:text-indigo-600 font-medium transition-colors">FAQ</a>
          </div>

          {/* Bagian Kanan: Bahasa dan Tombol Login/Register */}
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex items-center gap-1 text-gray-500 hover:text-gray-900 font-medium px-2">
              <i className="fas fa-globe"></i> ID <i className="fas fa-chevron-down text-xs ml-1"></i>
            </button>
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