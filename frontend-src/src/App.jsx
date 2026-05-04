import React from 'react';
// Memanggil komponen-komponen yang sudah kita buat
import StatCards from './components/sdg/StatCards';
import SdgDistributionChart from './components/sdg/SdgDistributionChart';
import SdgTrendChart from './components/sdg/SdgTrendChart';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Menyisipkan 4 Kotak Statistik Utama di bagian atas */}
        <StatCards />

        {/* Layout Grid untuk Grafik Donat dan Grafik Garis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
          <SdgDistributionChart />
          <SdgTrendChart />
        </div>

      </div>
    </div>
  );
}

export default App;