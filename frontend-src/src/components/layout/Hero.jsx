import React from 'react';

const Hero = () => {
  return (
    // 1. ROOT WRAPPER: Bebas hambatan. 
    // Tanpa overflow-hidden, tanpa padding atas/bawah di sini.
    <div className="relative w-full font-sans">
      
      {/* 2. LAYER GAMBAR (SISI KANAN) */}
      {/* Posisinya absolute, langsung menempel ke tepi kanan viewport browser */}
      <div className="absolute inset-y-0 right-0 w-full lg:w-[60vw] flex items-center justify-end pointer-events-none z-0">
        <img 
          src="/assets/img/Hero-Illustrated.png" 
          alt="Ilustrasi Homepage" 
          // max-w-none dilepas. Ukurannya mengikuti layar tanpa dikurung container teks.
          className="w-full max-w-[600px] lg:max-w-[900px] h-auto object-contain object-right"
          // PENAMBAHAN MASKING: 
          // linear-gradient ini akan membuat transisi transparan di 15% sisi kiri dan 15% sisi kanan gambar.
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
            maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)'
          }}
        />
      </div>

      {/* 3. LAYER TEKS (SISI KIRI) */}
      {/* Padding vertikal (jarak area hero) ditaruh HANYA di container ini */}
      {/* max-w-7xl menahan agar teks tetap sejajar dengan navbar */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-4 lg:px-4 pt-12 pb-24 z-10 pointer-events-auto">
        
        {/* Teks dibatasi lebarnya (50%) agar tidak menimpa gambar di desktop */}
        <div className="w-full lg:w-[50%] flex flex-col justify-center text-center lg:text-left">
          
          {/* Badge AI */}
          <div className="inline-flex items-center justify-center lg:justify-start px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold tracking-wider mb-6 w-max mx-auto lg:mx-0">
            <span className="mr-2 text-sm">✨</span> AI-POWERED RESEARCH INTELLIGENCE
          </div>

          {/* Judul Utama */}
          <h1 className="text-4xl md:text-5xl lg:text-[48px] font-bold text-gray-900 leading-[1.2] mb-6 tracking-tight">
            Menghubungkan Riset <br className="hidden lg:block" />
            dengan{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Tujuan Global
            </span>
          </h1>
          
          {/* Deskripsi */}
          <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-[540px] mx-auto lg:mx-0 leading-relaxed font-normal">
            Sciecola menganalisis dan mengklasifikasikan artikel ilmiah berdasarkan Sustainable Development Goals (SDGs) secara otomatis menggunakan kecerdasan buatan.
          </p>
          
          {/* Tombol Aksi */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            
            <button className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30 group">
              Jelajahi Riset 
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            
            <button className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 border-2 border-indigo-100 text-base font-medium rounded-xl text-indigo-700 bg-white hover:bg-indigo-50 transition-all">
              Analisis Artikel 
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 ml-2 text-indigo-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;