import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ComposedChart
} from 'recharts';

const TrendsAnalysis = () => {
  // State
  const [timeRange, setTimeRange] = useState('all');
  const [selectedField, setSelectedField] = useState('all');
  const [showInsights, setShowInsights] = useState(true);
  
  // Data untuk analisis tren
  const impactTrends = [
    { year: 2019, akademik: 58, sosial: 42, praktis: 35, total: 49 },
    { year: 2020, akademik: 63, sosial: 48, praktis: 37, total: 53 },
    { year: 2021, akademik: 67, sosial: 52, praktis: 43, total: 57 },
    { year: 2022, akademik: 72, sosial: 58, praktis: 47, total: 62 },
    { year: 2023, akademik: 78, sosial: 65, praktis: 54, total: 68 },
    { year: 2024, akademik: 84, sosial: 71, praktis: 61, total: 74 }
  ];
  
  // Data untuk tren per bidang
  const fieldTrends = [
    { year: 2019, ti: 68, med: 71, agr: 62, eng: 66, soc: 59 },
    { year: 2020, ti: 72, med: 73, agr: 64, eng: 69, soc: 62 },
    { year: 2021, ti: 75, med: 76, agr: 68, eng: 71, soc: 65 },
    { year: 2022, ti: 78, med: 78, agr: 70, eng: 74, soc: 68 },
    { year: 2023, ti: 81, med: 80, agr: 73, eng: 76, soc: 70 },
    { year: 2024, ti: 84, med: 82, agr: 75, eng: 78, soc: 73 }
  ];
  
  // Data untuk tren kolaborasi
  const collaborationTrends = [
    { year: 2019, nasional: 72.5, internasional: 27.5 },
    { year: 2020, nasional: 70.2, internasional: 29.8 },
    { year: 2021, nasional: 67.8, internasional: 32.2 },
    { year: 2022, nasional: 64.5, internasional: 35.5 },
    { year: 2023, nasional: 60.3, internasional: 39.7 },
    { year: 2024, nasional: 56.5, internasional: 43.5 }
  ];
  
  // Data untuk negara kolaborator
  const topCollaboratorCountries = [
    { country: 'Malaysia', collaborations: 1872 },
    { country: 'Australia', collaborations: 1625 },
    { country: 'Jepang', collaborations: 1450 },
    { country: 'AS', collaborations: 1320 },
    { country: 'Singapura', collaborations: 1240 },
    { country: 'China', collaborations: 980 },
    { country: 'Belanda', collaborations: 850 },
    { country: 'Inggris', collaborations: 780 }
  ];
  
  // Data untuk prediksi tren
  const predictionData = [
    { year: 2019, actual: 49, predicted: null },
    { year: 2020, actual: 53, predicted: 51 },
    { year: 2021, actual: 57, predicted: 56 },
    { year: 2022, actual: 62, predicted: 60 },
    { year: 2023, actual: 68, predicted: 65 },
    { year: 2024, actual: 74, predicted: 71 },
    { year: 2025, actual: null, predicted: 78 },
    { year: 2026, actual: null, predicted: 83 }
  ];
  
  // Data untuk tren topik penelitian
  const researchTopicsTrends = [
    { topic: 'Kecerdasan Buatan', growth: 35.4, publications: 1845, avgImpact: 82.7 },
    { topic: 'Energi Terbarukan', growth: 28.9, publications: 1420, avgImpact: 79.4 },
    { topic: 'Perubahan Iklim', growth: 26.5, publications: 1350, avgImpact: 80.1 },
    { topic: 'Kesehatan Digital', growth: 24.2, publications: 1260, avgImpact: 78.5 },
    { topic: 'Keamanan Pangan', growth: 21.7, publications: 1180, avgImpact: 76.8 },
    { topic: 'Ekonomi Digital', growth: 20.3, publications: 1050, avgImpact: 75.2 },
    { topic: 'Keanekaragaman Hayati', growth: 18.6, publications: 980, avgImpact: 77.4 },
    { topic: 'Teknologi Pendidikan', growth: 17.9, publications: 925, avgImpact: 74.6 }
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-12">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <Link to="/analytics" className="hover:text-indigo-600 transition-colors">Analytics</Link>
        <span className="text-gray-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <span className="text-gray-900 font-medium">Trends Analysis</span>
      </nav>

      {/* Header dan Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-2 md:space-y-0">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Analisis Trend Penelitian</h1>
          <p className="text-lg font-semibold text-gray-600 mt-1 max-w-2xl">Analisis mendalam tentang tren dampak penelitian, kolaborasi, dan topik terpanas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select 
            className="border rounded-md px-4 py-2.5 text-sm"
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
          >
            <option value="all">Semua Bidang</option>
            <option value="ti">Teknologi Informasi</option>
            <option value="med">Kedokteran</option>
            <option value="agr">Pertanian</option>
            <option value="eng">Teknik</option>
            <option value="soc">Sosial Ekonomi</option>
          </select>
          <select 
            className="border rounded-md px-4 py-2.5 text-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="all">Semua Waktu</option>
            <option value="3years">3 Tahun Terakhir</option>
            <option value="5years">5 Tahun Terakhir</option>
          </select>
          <button 
            className={`px-4 py-2.5 text-sm rounded-md shadow-sm transition-colors ${showInsights ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setShowInsights(!showInsights)}
          >
            {showInsights ? 'Sembunyikan Insights' : 'Tampilkan Insights'}
          </button>
        </div>
      </div>
      
      {/* Ikhtisar Analisis */}
      {showInsights && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ikhtisar Analisis Trend Penelitian
          </h3>
          
          <div className="bg-green-50 p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-m font-semibold mb-2 text-gray-700">Tren Utama:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    Peningkatan signifikan pada semua dimensi dampak penelitian (akademik, sosial, praktis) dengan rata-rata +51.0% dalam 5 tahun terakhir
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    Percepatan kolaborasi internasional dengan peningkatan +58.2%, yang mencerminkan keberhasilan program internasionalisasi penelitian
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    Fokus pada bidang-bidang strategis (Kecerdasan Buatan, Energi Terbarukan, dan Perubahan Iklim) dengan pertumbuhan dan dampak tertinggi
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-m font-semibold mb-2 text-gray-700">Rekomendasi Kebijakan:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                    </svg>
                    Meningkatkan dukungan untuk penelitian di bidang dengan pertumbuhan tinggi seperti AI dan Energi Terbarukan
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                    </svg>
                    Memperkuat program kolaborasi internasional terutama dengan mitra utama di ASEAN dan negara prioritas lainnya
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                    </svg>
                    Mengembangkan mekanisme diseminasi yang lebih baik untuk meningkatkan dampak media sosial dan praktis dari penelitian
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                    </svg>
                    Mempertahankan dan memperluas hibah penelitian berdasarkan model prediksi dampak dan relevansi
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 text-m text-gray-600">
              <p className="italic">
                "Tren dampak penelitian Indonesia menunjukkan progres signifikan dalam 5 tahun terakhir, dengan peningkatan pada semua dimensi dampak dan penguatan posisi global. Prediksi untuk 2 tahun ke depan mengindikasikan pertumbuhan berkelanjutan, dengan kemungkinan mencapai skor dampak 83.0 pada tahun 2026 jika tren saat ini berlanjut."
              </p>
              <p className="text-right text-xs text-gray-500 mt-1">- Analisis Wizdom Indonesia, Mei 2025</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Topik Potensial & Emerging */}
      <div className="mt-6 bg-transparent">
        <h3 className="text-lg font-semibold mb-4">Topik Penelitian Potensial di Indonesia (2025-2030)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center mb-2">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="font-medium text-blue-800">Inovasi Teknologi</h4>
            </div>
            <ul className="text-sm space-y-1 text-blue-700">
              <li>• AI untuk Bahasa dan Budaya Lokal</li>
              <li>• Kota Pintar dan Mobilitas Berkelanjutan</li>
              <li>• Teknologi Blockchain untuk Governance</li>
            </ul>
            <div className="mt-2 text-xs text-blue-600">
              <span className="font-semibold">Potensi dampak:</span> Sangat tinggi
            </div>
          </div>
          
          <div className="bg-green-50 p-3 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center mb-2">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h4 className="font-medium text-green-800">Keberlanjutan</h4>
            </div>
            <ul className="text-sm space-y-1 text-green-700">
              <li>• Ketahanan Pangan Berbasis Ekosistem</li>
              <li>• Energi Bersih untuk Wilayah Terpencil</li>
              <li>• Adaptasi Perubahan Iklim di Wilayah Pesisir</li>
            </ul>
            <div className="mt-2 text-xs text-green-600">
              <span className="font-semibold">Potensi dampak:</span> Tinggi
            </div>
          </div>
          
          <div className="bg-yellow-50 p-3 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center mb-2">
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center mr-2">
                <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h4 className="font-medium text-yellow-800">Kesehatan & Biomedis</h4>
            </div>
            <ul className="text-sm space-y-1 text-yellow-700">
              <li>• Kedokteran Presisi untuk Penyakit Tropis</li>
              <li>• Biofarmasi dari Keanekaragaman Hayati</li>
              <li>• Kesiapsiagaan Pandemi dan Penyakit Menular</li>
            </ul>
            <div className="mt-2 text-xs text-yellow-600">
              <span className="font-semibold">Potensi dampak:</span> Sangat tinggi
            </div>
          </div>
        </div>
      </div>
      
      {/* Prediksi dan Topik Trending */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-md font-semibold mb-4">Prediksi Dampak Penelitian</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={predictionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="actual" stroke="#8884d8" strokeWidth={2} name="Dampak Aktual" />
              <Line type="monotone" dataKey="predicted" stroke="#82ca9d" strokeDasharray="5 5" strokeWidth={2} name="Dampak Prediksi" />
            </ComposedChart>
          </ResponsiveContainer>
          
          {showInsights && (
            <div className="mt-4 bg-indigo-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-indigo-800 flex items-center">
                <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                Insight Prediksi
              </h4>
              <p className="text-sm text-indigo-700 mt-1">
                Prediksi menunjukkan peningkatan dampak penelitian Indonesia sebesar ~12.1% dalam 2 tahun ke depan, mencapai skor 83.0 pada tahun 2026.
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-md font-semibold mb-4">Topik Penelitian dengan Pertumbuhan Tertinggi</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={researchTopicsTrends} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="topic" type="category" width={140} />
              <Tooltip />
              <Legend />
              <Bar dataKey="growth" fill="#8884d8" name="Pertumbuhan (%)" />
            </BarChart>
          </ResponsiveContainer>
          
          {showInsights && (
            <div className="mt-4 bg-purple-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-purple-800 flex items-center">
                <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
                Insight Topik Trending
              </h4>
              <p className="text-sm text-purple-700 mt-1">
                Kecerdasan Buatan, Energi Terbarukan, dan Perubahan Iklim adalah tiga topik dengan pertumbuhan dan dampak tertinggi.
              </p>
              <p className="text-sm text-purple-700 mt-1">
                Topik-topik ini juga memiliki tingkat kolaborasi internasional yang lebih tinggi dari rata-rata.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Tren Dampak Penelitian */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-semibold">Tren Dampak Penelitian (2019-2024)</h3>
          
          {showInsights && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 text-sm text-yellow-700">
              <p className="flex items-center">
                <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                </svg>
                Dampak media sosial menunjukkan pertumbuhan tercepat (+69.0%)
              </p>
            </div>
          )}
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={impactTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="akademik" stroke="#8884d8" name="Dampak Akademik" strokeWidth={2} />
            <Line type="monotone" dataKey="sosial" stroke="#82ca9d" name="Dampak Media Sosial" strokeWidth={2} />
            <Line type="monotone" dataKey="praktis" stroke="#ffc658" name="Dampak Penggunaan Praktis" strokeWidth={2} />
            <Line type="monotone" dataKey="total" stroke="#ff7300" name="Skor Dampak Total" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800">Dampak Akademik</h4>
            <p className="text-2xl font-bold text-blue-700">+44.8%</p>
            <p className="text-xs text-blue-600">Peningkatan dari 2019</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-green-800">Dampak Media Sosial</h4>
            <p className="text-2xl font-bold text-green-700">+69.0%</p>
            <p className="text-xs text-green-600">Peningkatan dari 2019</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800">Dampak Penggunaan Praktis</h4>
            <p className="text-2xl font-bold text-yellow-700">+74.3%</p>
            <p className="text-xs text-yellow-600">Peningkatan dari 2019</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-orange-800">Dampak Total</h4>
            <p className="text-2xl font-bold text-orange-700">+51.0%</p>
            <p className="text-xs text-orange-600">Peningkatan dari 2019</p>
          </div>
        </div>
      </div>
      
      {/* Tren per Bidang dan Kolaborasi */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-semibold">Tren Dampak per Bidang Studi</h3>
            
            {showInsights && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-2 text-sm text-blue-700">
                <p className="flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                  </svg>
                  Teknologi Informasi menjadi bidang dengan pertumbuhan dampak tertinggi
                </p>
              </div>
            )}
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={fieldTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis domain={[50, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="ti" stroke="#8884d8" name="Teknologi Informasi" />
              <Line type="monotone" dataKey="med" stroke="#82ca9d" name="Kedokteran" />
              <Line type="monotone" dataKey="agr" stroke="#ffc658" name="Pertanian" />
              <Line type="monotone" dataKey="eng" stroke="#ff7300" name="Teknik" />
              <Line type="monotone" dataKey="soc" stroke="#ff5252" name="Sosial Ekonomi" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-semibold">Tren Kolaborasi Internasional</h3>
            
            {showInsights && (
              <div className="bg-green-50 border-l-4 border-green-400 p-2 text-sm text-green-700">
                <p className="flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                  </svg>
                  Kolaborasi internasional meningkat +58.2% dalam 5 tahun
                </p>
              </div>
            )}
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={collaborationTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="nasional" stackId="1" stroke="#8884d8" fill="#8884d8" name="Kolaborasi Nasional (%)" />
              <Area type="monotone" dataKey="internasional" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Kolaborasi Internasional (%)" />
            </AreaChart>
          </ResponsiveContainer>
          
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Negara Kolaborator Utama</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {topCollaboratorCountries.slice(0, 4).map((country, index) => (
                <div key={index} className="bg-gray-50 p-2 rounded text-center">
                  <p className="text-xs text-gray-500">{country.country}</p>
                  <p className="text-sm font-semibold">{country.collaborations.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Benchmark Global */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-md font-semibold mb-4">Perbandingan Dampak Penelitian Regional</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={[
              { country: 'Singapura', impact: 86.4, growth: 7.2 },
              { country: 'Malaysia', impact: 78.3, growth: 12.4 },
              { country: 'Indonesia', impact: 74.6, growth: 15.8 },
              { country: 'Thailand', impact: 72.1, growth: 10.5 },
              { country: 'Vietnam', impact: 68.4, growth: 18.3 },
              { country: 'Filipina', impact: 65.8, growth: 14.2 }
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="country" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="impact" fill="#8884d8" name="Skor Dampak Rata-rata" />
            <Bar yAxisId="right" dataKey="growth" fill="#82ca9d" name="Pertumbuhan Dampak (%)" />
          </BarChart>
        </ResponsiveContainer>
        
        {showInsights && (
          <div className="mt-4 bg-purple-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-purple-800 flex items-center">
              <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              Insight Regional
            </h4>
            <p className="text-sm text-purple-700 mt-1">
              Indonesia menempati posisi ketiga di ASEAN dari segi dampak penelitian rata-rata, namun memiliki pertumbuhan yang kuat (15.8%) dibandingkan dengan negara lain di kawasan. Dengan tren ini, Indonesia diprediksi dapat melampaui Malaysia dalam 3-4 tahun ke depan.
            </p>
          </div>
        )}
      </div>

    </main>
  );
};

export default TrendsAnalysis;