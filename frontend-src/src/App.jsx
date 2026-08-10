import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Outlet } from 'react-router';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';
import ScrollToTop from './components/shared/ScrollToTop';

// Komponen Layout Global
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Impor Halaman Public (landing page untuk user belum login)
import PublicHomePage from './pages/PublicHomePage';

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

// Impor Halaman Insights AI
import InsightsPage from './pages/InsightsPage';

// Impor Halaman Collaboration & Networking
import CollaborationHub from './pages/CollaborationHub';
import ProjectManagement from './pages/ProjectManagement';
import ResearchMatching from './pages/ResearchMatching';
import InnovationMarketplace from './pages/InnovationMarketplace';

// Impor Halaman Tentang dan Tim
import About from './pages/About';
import History from './pages/History';
import Teams from './pages/Teams';
import TeamMemberProfile from './pages/TeamMemberProfile';
import Sponsors from './pages/Sponsors';
import BecomeSponsor from './pages/BecomeSponsor';
import Partners from './pages/Partners';

// Impor Halaman Syarat dan Ketentuan
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

// Impor Halaman Dokumentasi
import Doc from './pages/Doc';
import Api from './pages/Api';

// Impor Halaman Bantuan dan FAQ
import Contact from './pages/Contact';
import Help from './pages/Help';
import Faq from './pages/Faq';
import TutorialOrcid from './pages/TutorialOrcid';
import TutorialDOI from './pages/TutorialDOI';
import TutorialResults from './pages/TutorialResults';
import TutorialExport from './pages/TutorialExport';

// Impor Halaman Register
import Register from './pages/Register';
import Login from './pages/Login';

// Impor Halaman Admin Dashboard Panel
import Admin from './pages/Admin';
import Monitoring from './pages/Monitoring';
import AdminPanel from './pages/AdminPanel';
import AdminLandingContent from './pages/AdminLandingContent';
import AdminTeams from './pages/AdminTeams';

// Impor Halaman User Dashboard 
import Feeds from './pages/Feeds';
import SciecoDashboard from './pages/SciecoDashboard';
import MyProfile from './pages/MyProfile';
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import MyArticles from './pages/MyArticles';
import MyCollections from './pages/MyCollections';
import CollectionDetail from './pages/CollectionDetail';
import MyStatistics from './pages/MyStatistics';
import Settings from './pages/Settings';
import ChangePassword from './pages/ChangePassword';

// Impor Halaman Log History/Activity
import MyActivity from './pages/MyActivity';
import LogHistory from './pages/LogHistory';

// Impor Chatbot
import Chatbot from './components/layout/Chatbot';

// Impor Halaman Error
import NotFound404 from './pages/NotFound404';
import ServerError500 from './pages/ServerError500';
import MaintenanceMode from './pages/MaintenanceMode';
import OfflineError from './pages/OfflineError';
import SystemStatus from './pages/SystemStatus';
import Sitemap from './pages/Sitemap';
import ErrorBoundary from './components/shared/ErrorBoundary';

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
    <main className="flex-grow pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
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
// HOME ROUTER — Tampilkan landing page publik atau dashboard SDG
// berdasarkan status login pengguna, tanpa redirect.
// =====================================================================
const HomeRouter = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Home /> : <PublicHomePage />;
};

// =====================================================================
// LAYOUT UTAMA (dengan Navbar, Footer, Chatbot)
// =====================================================================
const MainLayout = () => (
  <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
    <Navbar />
    <Outlet />
    <Footer />
    <Chatbot />
  </div>
);

// =====================================================================
// APLIKASI UTAMA (ROUTER)
// =====================================================================
function App() {
  return (
    <AuthProvider>
      <Router>
        <ErrorBoundary>
          {/* Scroll ke atas setiap perpindahan halaman */}
          <ScrollToTop />

          {/* Pengatur Lalu Lintas Halaman */}
          <Routes>
            {/* ============================================== */}
            {/* HALAMAN DENGAN NAVBAR + FOOTER + CHATBOT      */}
            {/* ============================================== */}
            <Route element={<MainLayout />}>
              {/* Halaman Utama */}
              <Route path="/" element={<HomeRouter />} />

              {/* Rute Jurnal */}
              <Route path="/journals" element={<JournalList />} />
              <Route path="/journals/:journalId" element={<JournalProfile />} />

              {/* Rute Institusi */}
              <Route path="/institutions" element={<InstitutionsList />} />
              <Route path="/institutions/:institutionId" element={<InstitutionProfile />} />

              {/* Rute Peneliti */}
              <Route path="/researchers" element={<ResearchersList />} />
              <Route path="/orcid/:orcidCode" element={<ResearcherProfile sourceType="orcid" />} />
              <Route path="/scopus/:id"       element={<ResearcherProfile sourceType="scopus" />} />
              <Route path="/sinta/:id"        element={<ResearcherProfile sourceType="sinta" />} />
              <Route path="/researcherid/:id" element={<ResearcherProfile sourceType="researcherid" />} />

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

              {/* Rute Insights AI */}
              <Route path="/insights" element={<InsightsPage />} />

              {/* Rute Collaboration & Networking */}
              <Route path="/collaboration" element={<CollaborationHub />} />
              <Route path="/projects" element={<ProjectManagement />} />
              <Route path="/research-matching" element={<ResearchMatching />} />
              <Route path="/innovation-marketplace" element={<InnovationMarketplace />} />

              {/* Rute Tentang */}
              <Route path="/about" element={<About />} />
              <Route path="/history" element={<History />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/teams/:memberSlug" element={<TeamMemberProfile />} />
              <Route path="/sponsors" element={<Sponsors />} />
              <Route path="/become-sponsor" element={<BecomeSponsor />} />
              <Route path="/partners" element={<Partners />} />

              {/* Rute Syarat dan Ketentuan */}
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />

              {/* Rute Kontak dan Bantuan */}
              <Route path="/contact" element={<Contact />} />
              <Route path="/sitemap" element={<Sitemap />} />
              <Route path="/system-status" element={<SystemStatus />} />
              <Route path="/help" element={<Help />} />
              <Route path="/tutorial-orcid" element={<TutorialOrcid />} />
              <Route path="/tutorial-doi" element={<TutorialDOI />} />
              <Route path="/tutorial-results" element={<TutorialResults />} />
              <Route path="/tutorial-export" element={<TutorialExport />} />

              {/* Rute Dokumentasi — MDX-based */}
              <Route path="/docs/documentation" element={<Doc />} />
              <Route path="/docs/faq" element={<Faq />} />
              <Route path="/docs/api-reference" element={<Api />} />

              {/* Rute Dashboard */}
              <Route path="/feeds" element={<Feeds />} />
              <Route path="/sciecodash" element={<SciecoDashboard />} />
              <Route path="/my-profile" element={<MyProfile />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/my-articles" element={<MyArticles />} />
              <Route path="/my-collections" element={<MyCollections />} />
              <Route path="/collections/:id" element={<CollectionDetail />} />
              <Route path="/my-statistics" element={<MyStatistics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/change-password" element={<ChangePassword />} />

              {/* Rute Log History/Activity */}
              <Route path="/my-activity" element={<MyActivity />} />
              <Route path="/log-history" element={<LogHistory />} />

              {/* Rute Register */}
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />

              {/* Rute Admin Panel Dashboard */}
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/monitoring" element={<Monitoring />} />
              <Route path="/admin/data-management" element={<AdminPanel />} />
              <Route path="/admin/landing-content" element={<AdminLandingContent />} />
              <Route path="/admin/teams" element={<AdminTeams />} />
            </Route>

            {/* ============================================== */}
            {/* HALAMAN ERROR (TANPA Navbar/Footer/Chatbot)   */}
            {/* ============================================== */}
            <Route path="/404" element={<NotFound404 />} />
            <Route path="/500" element={<ServerError500 />} />
            <Route path="/maintenance" element={<MaintenanceMode />} />
            <Route path="/offline" element={<OfflineError />} />

            {/* Catch-all route untuk 404 (tanpa layout) */}
            <Route path="*" element={<NotFound404 />} />
          </Routes>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}

export default App;