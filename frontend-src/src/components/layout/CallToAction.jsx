import React from 'react';

const CallToAction = () => {
  return (
    // Mengubah p-8 md:p-12 menjadi p-6 (setara dengan padding: 1.5rem)
    <div className="bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#8B5CF6] rounded-2xl p-6 mt-12 mb-8 flex flex-col lg:flex-row items-center justify-between text-white shadow-xl relative overflow-hidden">
      
      {/* Elemen Dekoratif */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
      
      {/* Konten Teks Kiri */}
      <div className="lg:w-1/2 mb-6 lg:mb-0 relative z-10 text-center lg:text-left">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          Siap untuk menganalisis riset Anda?
        </h2>
        <p className="text-indigo-100 text-sm md:text-base leading-relaxed">
          Masukkan DOI atau ORCID untuk melihat analisis dan klasifikasi SDGs secara instan.
        </p>
      </div>

      {/* Konten Kanan: Input & Tombol */}
      <div className="lg:w-1/2 flex justify-center lg:justify-end w-full relative z-10">
        
        {/* Container Input */}
        <div className="bg-white rounded-xl md:rounded-full p-1.5 flex flex-col md:flex-row w-full max-w-lg shadow-md">
          
          <input 
            type="text" 
            placeholder="Masukkan DOI atau ORCID" 
            // Dikembalikan ke py-3 agar teks di dalam input tidak terasa sesak
            className="flex-1 px-5 py-3 text-gray-700 text-sm md:text-base outline-none bg-transparent rounded-full placeholder-gray-400"
          />
          
          {/* Dikembalikan ke py-3 agar serasi dengan tinggi input */}
          <button className="bg-[#5A67D8] hover:bg-[#4C51BF] text-white px-6 py-3 rounded-lg md:rounded-full text-sm md:text-base font-medium flex items-center justify-center gap-2 mt-2 md:mt-0 transition-colors">
            Analisis Sekarang
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          
        </div>

      </div>
      
    </div>
  );
};

export default CallToAction;