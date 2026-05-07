import React, { useState } from 'react';
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
import TrustedSources from './components/layout/TrustedSources';
import CallToAction from './components/layout/CallToAction';

// 1. Impor Wrapper Adapter
import { transformToChartData, generateSummaryStats } from './utils/sdgDataAdapter';

function App() {
  // === STATE MANAGEMENT ===
  // Menampung data utuh dari API
  const [rawApiData, setRawApiData] = useState(null);
  
  // Menampung data yang sudah diolah/diterjemahkan khusus untuk UI
  const [chartData, setChartData] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);

  // === FUNGSI PENERIMA DATA ===
  // Fungsi ini akan dipanggil oleh HeroSearch saat API selesai menarik data
  const handleAnalysisComplete = (dataDariApi) => {
    // 1. Simpan data mentahnya (jika dibutuhkan oleh komponen lain seperti tabel)
    setRawApiData(dataDariApi);

    // 2. Terjemahkan data menggunakan Wrapper
    // Asumsi: dataDariApi memiliki properti 'works' (array) dan 'total_works'
    const formattedChart = transformToChartData(dataDariApi.works);
    const stats = generateSummaryStats(dataDariApi.works, dataDariApi.total_works);

    // 3. Simpan ke state untuk memicu re-render UI
    setChartData(formattedChart);
    setSummaryStats(stats);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* 2. Kirim fungsi penerima ke Hero */}
        <Hero onAnalysisComplete={handleAnalysisComplete} />
        
        {/* Render komponen statistik HANYA JIKA data sudah ada */}
        {summaryStats ? (
          <StatCards data={summaryStats} />
        ) : (
          <StatCards /> /* Bisa diisi versi kosong/default statis sementara */
        )}

        <CallToAction />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* 3. Kirim data chart yang sudah diolah ke komponen Donut */}
          <SdgDistributionChart 
             data={chartData.length > 0 ? chartData : null} 
             totalArticles={summaryStats ? summaryStats.totalArticles : "0"} 
          />
          <SdgTrendChart rawData={rawApiData} />
        </div>

        <TopSdgsCard rawData={rawApiData} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <LatestArticles works={rawApiData ? rawApiData.works : []} />
          </div>
          
          <div className="lg:col-span-1">
             <InsightsAI rawData={rawApiData} />
          </div>
        </div>

        <ResearchExplorer rawData={rawApiData} />
        
        <TrustedSources />
      </main>

      <Footer />
    </div>
  );
}

export default App;