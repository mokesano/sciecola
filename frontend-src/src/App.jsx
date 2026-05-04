import React from 'react';
import HeroSearch from './components/layout/Hero';
import StatCards from './components/sdg/StatCards';
import SdgDistributionChart from './components/sdg/SdgDistributionChart';
import SdgTrendChart from './components/sdg/SdgTrendChart';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* 1. Area Pencarian dan Sambutan (Paling Atas) */}
        <HeroSearch />

        {/* 2. Kartu Statistik Utama */}
        <StatCards />

        {/* 3. Layout Grid untuk Grafik Donat dan Garis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
          <SdgDistributionChart />
          <SdgTrendChart />
        </div>

      </div>
    </div>
  );
}

export default App;