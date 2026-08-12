import React from 'react';

const EmptyState = ({ 
  title = "Data Tidak Tersedia", 
  message = "Belum ada data aktivitas untuk rentang waktu yang dipilih.",
  height = "h-64" // Bisa disesuaikan dengan tinggi card chart Anda (misal: h-80, h-96)
}) => {
  return (
    <div className={`flex flex-col items-center justify-center w-full ${height} bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200 p-6 text-center`}>
      
      {/* Ilustrasi SVG Grafik Pudar */}
      <div className="relative mb-4">
        <svg 
          className="w-24 h-20 text-gray-200" 
          viewBox="0 0 100 80" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Garis Horizontal Background */}
          <path d="M10 60 L90 60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 4" />
          <path d="M10 40 L90 40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 4" />
          <path d="M10 20 L90 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 4" />
          
          {/* Bar Chart Pudar */}
          <rect x="20" y="30" width="12" height="30" rx="2" fill="currentColor" opacity="0.4" />
          <rect x="45" y="45" width="12" height="15" rx="2" fill="currentColor" opacity="0.4" />
          <rect x="70" y="20" width="12" height="40" rx="2" fill="currentColor" opacity="0.4" />
          
          {/* Line Chart Halus */}
          <path d="M26 25 L51 40 L76 15" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" />
        </svg>
        
        {/* Ikon Tanda Seru/Pencarian di Pojok Kanan Bawah SVG */}
        <div className="absolute -bottom-1 -right-2 bg-white rounded-full p-1 shadow-sm border border-gray-100">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
      </div>
      
      {/* Teks Keterangan */}
      <h4 className="text-[15px] font-semibold text-gray-800 mb-1">{title}</h4>
      <p className="text-sm text-gray-500 max-w-[250px] leading-relaxed">
        {message}
      </p>
    </div>
  );
};

export default EmptyState;