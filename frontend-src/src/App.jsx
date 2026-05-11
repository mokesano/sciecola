import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ScrollToTop from './components/shared/ScrollToTop';

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

// Impor Halaman Institusi
import InstitutionsList from './pages/InstitutionsList';
import InstitutionProfile from './pages/InstitutionProfile';

// Impor Halaman Artikel
import ArticleList from './pages/ArticleList';
import ArticleProfile from './pages/ArticleProfile';

// Impor Halaman SDGs Cluster dan Analytics
import SdgsCluster from './pages/SdgsCluster';
import Analytics from './pages/Analytics';
import TrendsAnalysis from './pages/TrendsAnalysis';
import ArticleImpactMetrics from './pages/ArticleImpactMetrics';
import TopResearchers from './pages/TopResearchers';
import ResearcherDistribution from './pages/ResearcherDistribution';

// Impor Halaman Leaderboard
import Leaderboard from './pages/Leaderboard';

// Impor Halaman Tentang dan Tim
import About from './pages/About';
import History from './pages/History';
import Teams from './pages/Teams';
import Sponsors from './pages/Sponsors';
import BecomeSponsor from './pages/BecomeSponsor';
import Partners from './pages/Partners';

// Impor Halaman Syarat dan Ketentuan
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

// Impor Halaman Bantuan dan FAQ
import Contact from './pages/Contact';
import Help from './pages/Help';
import Faq from './pages/Faq';

// Impor Halaman Dokumentasi
import Doc from './pages/Doc';
import Api from './pages/Api';

// Impor Halaman Register
import Register from './pages/Register';
import Login from './pages/Login';

// Impor Halaman Admin Dashboard
import Admin from './pages/Admin';
import Monitoring from './pages/Monitoring';

// Impor Halaman User Dashboard 
import Feeds from './pages/Feeds';
import SciecoDashboard from './pages/SciecoDashboard';
import MyProfile from './pages/MyProfile';
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import MyArticles from './pages/MyArticles';
import MyCollections from './pages/MyCollections';
import MyStatistics from './pages/MyStatistics';
import Settings from './pages/Settings';

// Impor Halaman Log History/Activity
import MyActivity from './pages/MyActivity';
import LogHistory from './pages/LogHistory';

// Impor Halaman Insights AI
import InsightsPage from './pages/InsightsPage';

// Impor Chatbot
import Chatbot from './components/layout/Chatbot';

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

      <div id="cta-section"><CallToAction /></div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <SdgDistributionChart
            data={chartData.length > 0 ? chartData : null}
            totalArticles={summaryStats ? summaryStats.totalArticles : null}
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
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
        
        {/* Navbar selalu tampil di semua halaman */}
        <Navbar />

        {/* Scroll ke atas setiap perpindahan halaman */}
        <ScrollToTop />

        {/* Pengatur Lalu Lintas Halaman */}
        <Routes>
          {/* Halaman Utama */}
          <Route path="/" element={<Home />} />
          
          {/* Rute Jurnal */}
          <Route path="/journals" element={<JournalList />} />
          <Route path="/journals/:journalId" element={<JournalProfile />} />
          
          {/* Rute Institusi */}
          <Route path="/institutions" element={<InstitutionsList />} />
          <Route path="/institutions/:institutionId" element={<InstitutionProfile />} />
          
          {/* Rute Peneliti */}
          <Route path="/researchers" element={<ResearchersList />} />
          <Route path="/orcid/:orcidCode" element={<ResearcherProfile />} />
          
          {/* Rute Artikel (Baru) */}
          <Route path="/articles" element={<ArticleList />} />
          <Route path="/doi/*" element={<ArticleProfile />} />

          {/* Rute SDGs Cluster dan Analytics */}
          <Route path="/sdgs" element={<SdgsCluster />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/trends-analysis" element={<TrendsAnalysis />} />
          <Route path="/article-impact" element={<ArticleImpactMetrics />} />
          <Route path="/top-researchers" element={<TopResearchers />} />
          <Route path="/researcher-distribution" element={<ResearcherDistribution />} />

          {/* Rute Leaderboard */}
          <Route path="/leaderboard" element={<Leaderboard />} />

          {/* Rute Tentang */}
          <Route path="/about" element={<About />} />
          <Route path="/history" element={<History />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/become-sponsor" element={<BecomeSponsor />} />
          <Route path="/partners" element={<Partners />} />

          {/* Rute Syarat dan Ketentuan */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* Rute Kontak dan Bantuan */}
          <Route path="/contact" element={<Contact />} />
          <Route path="/help" element={<Help />} />

          {/* Rute Dokumentasi — MDX-based */}
          <Route path="/docs/documentation" element={<Doc />} />
          <Route path="/docs/faq" element={<Faq />} />
          <Route path="/docs/api-reference" element={<Api />} />

          {/* Rute Admin Dashboard */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/monitoring" element={<Monitoring />} />

          {/* Rute Dashboard */}
          <Route path="/feeds" element={<Feeds />} />
          <Route path="/sciecodash" element={<SciecoDashboard />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/my-articles" element={<MyArticles />} />
          <Route path="/my-collections" element={<MyCollections />} />
          <Route path="/my-statistics" element={<MyStatistics />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Rute Log History/Activity */}
          <Route path="/my-activity" element={<MyActivity />} />
          <Route path="/log-history" element={<LogHistory />} />

          {/* Rute Insights AI */}
          <Route path="/insights" element={<InsightsPage />} />

          {/* Rute Register */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>

        {/* Footer selalu tampil di semua halaman */}
        <Footer />

        {/* Floating Chatbot */}
        <Chatbot />

      </div>
      </Router>
    </AuthProvider>
  );
}

export default App;