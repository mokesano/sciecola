import React from 'react';

const Footer = () => {
  return (
    // Background gelap sesuai desain
    <footer className="bg-[#111827] text-gray-300 pt-16 pb-8 border-t-[6px] border-indigo-600 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Layout Grid Utama: Diubah menjadi lg:grid-cols-12 agar semua kolom muat dalam 1 baris */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 mb-12">
          
          {/* Kolom 1: Logo dan Deskripsi (Makan proporsi 3 dari 12 kolom) */}
          <div className="md:col-span-2 lg:col-span-3 lg:pr-4">
            <div className="text-white text-3xl font-black tracking-wide mb-2">WIZDAM</div>
            <div className="text-xs text-indigo-400 mb-6 uppercase tracking-wider font-semibold">SDGs Classification & Analytics</div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Platform analitik riset berbasis AI untuk mengklasifikasikan dan memvisualisasikan kontribusi riset terhadap Sustainable Development Goals (SDGs).
            </p>
            {/* Ikon Sosial Media */}
            <div className="flex gap-4">
              <a href="#" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-500 hover:-translate-y-1 text-white transition-all"><i className="fab fa-facebook-f text-sm"></i></a>
              <a href="#" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-500 hover:-translate-y-1 text-white transition-all"><i className="fab fa-twitter text-sm"></i></a>
              <a href="#" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-500 hover:-translate-y-1 text-white transition-all"><i className="fab fa-linkedin-in text-sm"></i></a>
              <a href="#" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-500 hover:-translate-y-1 text-white transition-all"><i className="fab fa-youtube text-sm"></i></a>
            </div>
          </div>

          {/* Kolom 2: Link Produk (Makan proporsi 2 dari 12 kolom) */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Produk</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Analytics</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">SDGs Explorer</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Researchers</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Journals</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">API</a></li>
            </ul>
          </div>
          
          {/* Kolom 3: Link Sumber Data (Makan proporsi 2 dari 12 kolom) */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Sumber Data</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Crossref</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">ORCID</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Dimensions</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Google Scholar</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">DataCite</a></li>
            </ul>
          </div>

          {/* Kolom 4: Link Informasi (Makan proporsi 2 dari 12 kolom) */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Informasi</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Tentang Kami</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Fitur</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Kebijakan Privasi</a></li>
            </ul>
          </div>

          {/* Kolom 5: Newsletter (Makan proporsi 3 dari 12 kolom) */}
          <div className="md:col-span-2 lg:col-span-3">
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Berlangganan Newsletter</h4>
            <p className="text-sm text-gray-400 mb-5 leading-relaxed">Dapatkan update terbaru tentang fitur dan analisis riset dari Wizdam.</p>
            <form className="flex flex-col gap-3">
              <input 
                type="email" 
                placeholder="Masukkan email Anda" 
                className="bg-gray-800/50 text-sm border border-gray-700 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all w-full"
              />
              <button 
                type="button" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-3.5 text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
              >
                Berlangganan
              </button>
            </form>
          </div>
          
        </div>

        {/* Bagian Bawah: Copyright */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>© 2024 Wizdam. All rights reserved.</p>
          <p className="mt-4 md:mt-0">Dikembangkan oleh <span className="text-gray-400 font-medium hover:text-indigo-400 cursor-pointer transition-colors">Sangia Research Media and Publishing</span></p>
        </div>
        
      </div>
    </footer>
  );
};

export default Footer;