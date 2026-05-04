import React from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Hero from './components/layout/Hero';
import StatCards from './components/sdg/StatCards';
import SdgDistributionChart from './components/sdg/SdgDistributionChart';
import SdgTrendChart from './components/sdg/SdgTrendChart';
import TopSdgsCard from './components/sdg/TopSdgsCard';
import LatestArticles from './components/sdg/LatestArticles';
import InsightsAI from './components/sdg/InsightsAI';
import ResearchExplorer from './components/sdg/ResearchExplorer';

// 1. Impor dua komponen baru
import TrustedSources from './components/layout/TrustedSources';
import CallToAction from './components/layout/CallToAction';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <Hero />
        <StatCards />
        <CallToAction />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <SdgDistributionChart />
          <SdgTrendChart />
        </div>

        <TopSdgsCard />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <LatestArticles />
          </div>
          
          <div className="lg:col-span-1">
             <InsightsAI />
          </div>
        </div>

        <ResearchExplorer />
        
        {/* 2. Pasang komponen baru di sini, sebelum tag penutup </main> */}
        <TrustedSources />

      </main>

      <Footer />
    </div>
  );
}

export default App;