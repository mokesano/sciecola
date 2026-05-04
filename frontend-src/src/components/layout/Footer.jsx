import React from 'react';

const Footer = () => {
  return (
    // Background gelap sesuai desain
    <footer className="bg-[#111827] text-gray-300 pt-16 pb-8 border-t-[6px] border-indigo-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Layout Grid Utama */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          
          {/* Kolom 1: Logo dan Deskripsi (Makan ruang lebih lebar) */}
          <div className="lg:col-span-2">
            <div className="text-white text-3xl font-black tracking-wide mb-2">WIZDAM</div>
            <div className="text-xs text-gray-500 mb-6 uppercase tracking-wider">SDGs Classification & Analytics</div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Platform analitik riset berbasis AI untuk mengklasifikasikan dan memvisualisasikan kontribusi riset terhadap Sustainable Development Goals (SDGs).
            </p>
            {/* Ikon Sosial Media */}
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-500 text-white transition-colors"><i className="fab fa-facebook-f text-sm"></i></a>
              <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-500 text-white transition-colors"><i className="fab fa-twitter text-sm"></i></a>
              <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-500 text-white transition-colors"><i className="fab fa-linkedin-in text-sm"></i></a>
              <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-500 text-white transition-colors"><i className="fab fa-youtube text-sm"></i></a>
            </div>
          </div>

          {/* Kolom 2-5: Link Menu */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Produk</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-indigo-400">Analytics</a></li>
              <li><a href="#" className="hover:text-indigo-400">SDGs Explorer</a></li>
              <li><a href="#" className="hover:text-indigo-400">Researchers</a></li>
              <li><a href="#" className="hover:text-indigo-400">Journals</a></li>
              <li><a href="#" className="hover:text-indigo-400">API</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Sumber Data</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-indigo-400">Crossref</a></li>
              <li><a href="#" className="hover:text-indigo-400">ORCID</a></li>
              <li><a href="#" className="hover:text-indigo-400">Dimensions</a></li>
              <li><a href="#" className="hover:text-indigo-400">Google Scholar</a></li>
              <li><a href="#" className="hover:text-indigo-400">DataCite</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Informasi</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-indigo-400">Tentang Kami</a></li>
              <li><a href="#" className="hover:text-indigo-400">Fitur</a></li>
              <li><a href="#" className="hover:text-indigo-400">FAQ</a></li>
              <li><a href="#" className="hover:text-indigo-400">Blog</a></li>
              <li><a href="#" className="hover:text-indigo-400">Kebijakan Privasi</a></li>
            </ul>
          </div>

          {/* Kolom Newsletter */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-semibold mb-4 text-sm">Berlangganan Newsletter</h4>
            <p className="text-sm text-gray-400 mb-4">Dapatkan update terbaru tentang fitur dan analisis riset dari Wizdam.</p>
            <form className="flex flex-col gap-3">
              <input 
                type="email" 
                placeholder="Masukkan email Anda" 
                className="bg-gray-800 text-sm border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 w-full"
              />
              <button 
                type="button" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
              >
                Berlangganan
              </button>
            </form>
          </div>
        </div>

        {/* Bagian Bawah: Copyright */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>© 2024 Wizdam. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Dikembangkan oleh Sangia Research Media and Publishing</p>
        </div>
        
      </div>
    </footer>
  );
};

export default Footer;