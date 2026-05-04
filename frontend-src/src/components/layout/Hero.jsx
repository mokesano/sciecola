import React from 'react';

const Hero = () => {
  return (
    // Pembungkus utama dengan posisi relatif agar bisa menata elemen di dalamnya
    <div className="relative bg-transparent overflow-hidden mb-12 mt-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10">
        
        {/* SISI KIRI: Area Teks dan Tombol */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center text-center lg:text-left z-10">
          
          {/* Badge AI */}
          <div className="inline-flex items-center justify-center lg:justify-start px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-wider mb-6 w-max mx-auto lg:mx-0">
            <i className="fas fa-robot mr-2"></i> AI-POWERED RESEARCH INTELLIGENCE
          </div>

          {/* Judul Utama */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Menghubungkan Riset <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              dengan Tujuan Global
            </span>
          </h1>
          
          {/* Deskripsi */}
          <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Wizdam menganalisis dan mengklasifikasikan artikel ilmiah berdasarkan Sustainable Development Goals (SDGs) secara otomatis menggunakan kecerdasan buatan.
          </p>
          
          {/* Tombol Aksi */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30">
              Jelajahi Riset <i className="fas fa-arrow-right ml-2"></i>
            </button>
            <button className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 border-2 border-indigo-100 text-base font-medium rounded-xl text-indigo-700 bg-white hover:bg-indigo-50 transition-all">
              Analisis Artikel <i className="fas fa-chart-bar ml-2"></i>
            </button>
          </div>
        </div>
        
        {/* SISI KANAN: Area Ilustrasi Gambar */}
        <div className="w-full lg:w-1/2 flex items-center justify-center relative mt-10 lg:mt-0 z-0">
          
          {/* Lingkaran blur latar belakang untuk estetika */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-300 rounded-full blur-[80px] opacity-30"></div>
          
          {/* Tempat Placeholder Gambar (Ganti dengan <img> Anda nantinya) */}
          <div className="w-full max-w-md aspect-square rounded-full flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 bg-white/50 backdrop-blur-sm relative z-10">
            <i className="fas fa-globe-asia text-6xl text-indigo-300 mb-4"></i>
            <p className="text-sm font-medium text-gray-500 text-center px-4">
              [Tempat Ilustrasi Bola Dunia dari Homepage.jpg]<br/>
              Ganti div ini dengan tag <strong>&lt;img src="/assets/gambar.png" /&gt;</strong>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Hero;