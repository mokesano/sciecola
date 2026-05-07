import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

// Komponen Layout Global
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Komponen Halaman Beranda (Home)
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

// Wrapper Adapter
import { transformToChartData, generateSummaryStats } from './utils/sdgDataAdapter';

// Impor Halaman Profil Dinamis
import JournalList from './pages/JournalList';
import JournalProfile from './pages/JournalProfile';

// Impor Halaman Peneliti
import ResearchersList from './pages/ResearchersList';
import ResearcherProfile from './pages/ResearcherProfile';

// Impor Halaman Artikel
import ArticleList from './pages/ArticleList';
import ArticleProfile from './pages/ArticleProfile';

// Impor Halaman SDGs Cluster dan Analytics
import SdgsCluster from './pages/SdgsCluster';
import Analytics from './pages/Analytics';

// =====================================================================
// KOMPONEN BERANDA (HOME)
// =====================================================================
const Home = () => {
  // === STATE MANAGEMENT ===
  const [rawApiData, setRawApiData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);

  // === FUNGSI PENERIMA DATA ===
  const handleAnalysisComplete = (dataDariApi) => {
    setRawApiData(dataDariApi);
    const formattedChart = transformToChartData(dataDariApi.works);
    const stats = generateSummaryStats(dataDariApi.works, dataDariApi.total_works);
    setChartData(formattedChart);
    setSummaryStats(stats);
  };

  return (
    <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <Hero onAnalysisComplete={handleAnalysisComplete} />
      
      {summaryStats ? (
        <StatCards data={summaryStats} />
      ) : (
        <StatCards />
      )}

      <CallToAction />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
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
  );
};

// =====================================================================
// APLIKASI UTAMA (ROUTER)
// =====================================================================
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
        
        {/* Navbar selalu tampil di semua halaman */}
        <Navbar />

        {/* Pengatur Lalu Lintas Halaman */}
        <Routes>
          {/* Halaman Utama */}
          <Route path="/" element={<Home />} />
          
          {/* Rute Jurnal */}
          <Route path="/journals" element={<JournalList />} />
          <Route path="/journals/:journalId" element={<JournalProfile />} />
          
          {/* Rute Peneliti */}
          <Route path="/researchers" element={<ResearchersList />} />
          <Route path="/orcid/:orcidCode" element={<ResearcherProfile />} />
          
          {/* ✅ Rute Artikel (Baru) */}
          <Route path="/articles" element={<ArticleList />} />
          <Route path="/doi/*" element={<ArticleProfile />} />

          {/* Rute SDGs Cluster dan Analytics */}
          <Route path="/sdgs" element={<SdgsCluster />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>

        {/* Footer selalu tampil di semua halaman */}
        <Footer />
        
      </div>
    </Router>
  );
}

export default App;