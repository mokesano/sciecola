import React from 'react';

const Hero = () => {
  return (
    <div className="relative bg-transparent overflow-hidden mb-12 mt-4 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10">
        
        {/* SISI KIRI: Area Teks dan Tombol */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center text-center lg:text-left z-10">
          
          {/* Badge AI */}
          <div className="inline-flex items-center justify-center lg:justify-start px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold tracking-wider mb-6 w-max mx-auto lg:mx-0">
            <span className="mr-2 text-sm">✨</span> AI-POWERED RESEARCH INTELLIGENCE
          </div>

          {/* Judul Utama */}
          <h1 className="text-4xl md:text-5xl lg:text-[52px] font-bold text-gray-900 leading-[1.2] mb-6 tracking-tight">
            Menghubungkan Riset <br />
            dengan{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Tujuan Global
            </span>
          </h1>
          
          {/* Deskripsi */}
          <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-[540px] mx-auto lg:mx-0 leading-relaxed font-normal">
            Wizdam menganalisis dan mengklasifikasikan artikel ilmiah berdasarkan Sustainable Development Goals (SDGs) secara otomatis menggunakan kecerdasan buatan.
          </p>
          
          {/* Tombol Aksi */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            
            {/* Tombol Primer (Jelajahi Riset) dengan SVG Panah */}
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
            
            {/* Tombol Sekunder (Analisis Artikel) dengan SVG Ikon Analitik */}
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
        
        {/* SISI KANAN: Area Ilustrasi Gambar */}
        <div className="w-full lg:w-1/2 flex items-center justify-center relative mt-10 lg:mt-0 z-0">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-300 rounded-full blur-[80px] opacity-30"></div>
          
          <img 
            src="/assets/img/hero.png" 
            alt="Ilustrasi Homepage" 
            className="w-full max-w-md aspect-square rounded-full object-cover relative z-10"
          />
        </div>
        
      </div>
    </div>
  );
};

export default Hero;