import React, { useState } from 'react';

const HeroSearch = () => {
  // Variabel (state) untuk menyimpan teks yang diketik pengguna
  const [inputValue, setInputValue] = useState('');

  // Fungsi yang dijalankan saat form disubmit (tombol Enter atau klik Cari)
  const handleSearchSubmit = (e) => {
    e.preventDefault(); // Mencegah halaman reload bawaan browser
    
    if (inputValue.trim() !== '') {
      // Nanti di sini kita akan memanggil fungsi AJAX ke API PHP Anda
      console.log("Memicu pencarian untuk data:", inputValue);
      alert(`Mencari data untuk: ${inputValue}\n(Integrasi API akan ditambahkan di langkah selanjutnya)`);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl p-10 md:p-16 mb-8 shadow-sm border border-gray-100 relative overflow-hidden">
      
      {/* Ornamen Latar Belakang (Opsional untuk estetika) */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Teks Sambutan Utama */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          Menghubungkan Riset dengan <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Tujuan Global</span>
        </h1>
        
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          Wizdam menganalisis dan mengklasifikasikan artikel ilmiah berdasarkan Sustainable Development Goals (SDGs) secara otomatis menggunakan kecerdasan buatan.
        </p>

        {/* Formulir Pencarian */}
        <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto relative">
          <div className="flex flex-col md:flex-row gap-4">
            
            {/* Kolom Input */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </div>
              <input
                type="text"
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-gray-700 text-lg"
                placeholder="Masukkan DOI atau ORCID"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)} // Memperbarui state setiap kali pengguna mengetik
              />
            </div>
            
            {/* Tombol Aksi */}
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              Analisis Sekarang <i className="fas fa-arrow-right ml-2"></i>
            </button>
          </div>
          
          {/* Petunjuk format yang valid */}
          <div className="text-left mt-3 text-sm text-gray-500 ml-2">
            <i className="fas fa-info-circle mr-1"></i> Contoh: 0000-0002-5152-9727 atau 10.1038/nature12373
          </div>
        </form>
      </div>
    </div>
  );
};

export default HeroSearch;