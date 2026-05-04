import React from 'react';
// Memanggil kedua komponen grafik yang sudah kita buat
import SdgDistributionChart from './components/sdg/SdgDistributionChart';
import SdgTrendChart from './components/sdg/SdgTrendChart';

function App() {
  return (
    // Background utama aplikasi
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Tempat untuk komponen Statistik (Total Artikel, dll) nantinya ditaruh di sini */}

        {/* Layout Grid: 1 kolom di HP, 2 kolom di layar besar (Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Menampilkan Grafik Donat SVG */}
          <SdgDistributionChart />
          
          {/* Menampilkan Grafik Garis SVG */}
          <SdgTrendChart />
        </div>

      </div>
    </div>
  );
}

export default App;