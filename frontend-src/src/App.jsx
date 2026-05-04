import React from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Hero from './components/layout/Hero';
import StatCards from './components/sdg/StatCards';
import SdgDistributionChart from './components/sdg/SdgDistributionChart';
import SdgTrendChart from './components/sdg/SdgTrendChart';

function App() {
  return (
    // Tambahkan pt-20 (padding-top) agar konten tidak tertutup Navbar yang fixed
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      
      {/* Navbar Global */}
      <Navbar />

      {/* Konten Utama Halaman Beranda */}
      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <Hero />
        <StatCards />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
          <SdgDistributionChart />
          <SdgTrendChart />
        </div>
      </main>

      {/* Footer Global */}
      <Footer />
      
    </div>
  );
}

export default App;