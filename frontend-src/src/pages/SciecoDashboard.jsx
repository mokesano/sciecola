import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ComposedChart
} from 'recharts';

const SciecoDashboard = () => {
  // State untuk tab aktif dan filter
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mapView, setMapView] = useState('province');
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedField, setSelectedField] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('all');
  
  // Data dummy untuk visualisasi
  const topArticlesData = [
    { 
      id: 1, 
      title: 'Implementasi Deep Learning untuk Pengenalan Pola Batik Indonesia', 
      authors: 'Wijaya, S., Santoso, R.', 
      journal: 'Jurnal Informatika Indonesia',
      year: 2023,
      citations: 28,
      social_mentions: 45,
      practical_uses: 12,
      sintaAccreditation: 'SINTA 2',
      impactScore: 87.4
    },
    { 
      id: 2, 
      title: 'Pengembangan Material Nano-komposit dari Limbah Pertanian', 
      authors: 'Purnama, A., Wijaya, H., Kusuma, T.', 
      journal: 'Jurnal Teknik Kimia Indonesia',
      year: 2024,
      citations: 15,
      social_mentions: 32,
      practical_uses: 18,
      sintaAccreditation: 'SINTA 1',
      impactScore: 84.5
    },
    { 
      id: 3, 
      title: 'Analisis Ketahanan Pangan di Wilayah Pesisir Menghadapi Perubahan Iklim', 
      authors: 'Handayani, R., Santoso, B.', 
      journal: 'Jurnal Ketahanan Nasional',
      year: 2023,
      citations: 22,
      social_mentions: 28,
      practical_uses: 15,
      sintaAccreditation: 'SINTA 2',
      impactScore: 82.9
    },
    { 
      id: 4, 
      title: 'Deteksi Dini Penyakit Tropis Menggunakan Machine Learning', 
      authors: 'Kusuma, T., Wijaya, S., Putra, D.', 
      journal: 'Jurnal Kedokteran Indonesia',
      year: 2024,
      citations: 19,
      social_mentions: 36,
      practical_uses: 8,
      sintaAccreditation: 'SINTA 1',
      impactScore: 80.7
    },
    { 
      id: 5, 
      title: 'Efektivitas Pembelajaran Daring di Pendidikan Tinggi', 
      authors: 'Hartono, L., Pratiwi, S.', 
      journal: 'Jurnal Pendidikan Indonesia',
      year: 2023,
      citations: 32,
      social_mentions: 42,
      practical_uses: 6,
      sintaAccreditation: 'SINTA 1',
      impactScore: 79.8
    }
  ];
  
  const topResearchersData = [
    {
      id: 1,
      name: 'Prof. Dr. Slamet Wijaya',
      affiliation: 'Universitas Indonesia',
      field: 'Teknologi Informasi',
      hIndex: 28,
      citations: 3240,
      publications: 87,
      impactScore: 92.5,
      location: 'Jakarta',
      collaborations: 34
    },
    {
      id: 2,
      name: 'Dr. Ratna Handayani',
      affiliation: 'Institut Teknologi Bandung',
      field: 'Sosial Ekonomi',
      hIndex: 24,
      citations: 2850,
      publications: 74,
      impactScore: 89.7,
      location: 'Bandung',
      collaborations: 29
    },
    {
      id: 3,
      name: 'Prof. Dr. Budi Santoso',
      affiliation: 'Universitas Gadjah Mada',
      field: 'Kedokteran',
      hIndex: 26,
      citations: 3120,
      publications: 82,
      impactScore: 88.3,
      location: 'Yogyakarta',
      collaborations: 41
    },
    {
      id: 4,
      name: 'Dr. Tri Kusuma',
      affiliation: 'Institut Pertanian Bogor',
      field: 'Pertanian',
      hIndex: 21,
      citations: 2340,
      publications: 65,
      impactScore: 85.9,
      location: 'Bogor',
      collaborations: 27
    },
    {
      id: 5,
      name: 'Prof. Dr. Hadi Wijaya',
      affiliation: 'Universitas Airlangga',
      field: 'Kimia',
      hIndex: 23,
      citations: 2680,
      publications: 71,
      impactScore: 84.2,
      location: 'Surabaya',
      collaborations: 32
    }
  ];
  
  const researchImpactByField = [
    { field: 'Teknologi Informasi', researcherCount: 1246, avgImpact: 82.4, publications: 8750, citations: 152680 },
    { field: 'Kedokteran', researcherCount: 1582, avgImpact: 79.8, publications: 11240, citations: 189540 },
    { field: 'Pertanian', researcherCount: 1124, avgImpact: 74.5, publications: 8120, citations: 105780 },
    { field: 'Teknik', researcherCount: 986, avgImpact: 77.2, publications: 7450, citations: 124650 },
    { field: 'Sosial Ekonomi', researcherCount: 875, avgImpact: 72.6, publications: 6240, citations: 92460 },
    { field: 'Pendidikan', researcherCount: 942, avgImpact: 71.9, publications: 6980, citations: 85940 },
    { field: 'Kimia', researcherCount: 720, avgImpact: 76.8, publications: 5820, citations: 98750 }
  ];
  
  const impactComponents = [
    { name: 'Sitasi Akademik', akademik: 45, sosial: 30, praktis: 25 },
    { name: 'Media Sosial', akademik: 20, sosial: 60, praktis: 40 },
    { name: 'Implementasi Praktis', akademik: 15, sosial: 25, praktis: 65 },
    { name: 'Kebijakan Publik', akademik: 35, sosial: 40, praktis: 55 },
    { name: 'Kolaborasi', akademik: 55, sosial: 35, praktis: 30 }
  ];
  
  const impactTrends = [
    { year: 2019, akademik: 58, sosial: 42, praktis: 35, total: 49 },
    { year: 2020, akademik: 63, sosial: 48, praktis: 37, total: 53 },
    { year: 2021, akademik: 67, sosial: 52, praktis: 43, total: 57 },
    { year: 2022, akademik: 72, sosial: 58, praktis: 47, total: 62 },
    { year: 2023, akademik: 78, sosial: 65, praktis: 54, total: 68 },
    { year: 2024, akademik: 84, sosial: 71, praktis: 61, total: 74 }
  ];
  
  const provinceResearcherData = [
    { province: 'DKI Jakarta', researchers: 2584, avgImpact: 82.4, institutions: 58, topField: 'Teknologi Informasi', lat: -6.2, lng: 106.8 },
    { province: 'Jawa Barat', researchers: 2150, avgImpact: 79.2, institutions: 72, topField: 'Teknik', lat: -6.9, lng: 107.6 },
    { province: 'Jawa Timur', researchers: 1960, avgImpact: 77.5, institutions: 68, topField: 'Pertanian', lat: -7.5, lng: 112.7 },
    { province: 'Jawa Tengah', researchers: 1845, avgImpact: 76.8, institutions: 65, topField: 'Pendidikan', lat: -7.1, lng: 110.4 },
    { province: 'DI Yogyakarta', researchers: 1520, avgImpact: 81.2, institutions: 42, topField: 'Sosial Ekonomi', lat: -7.8, lng: 110.3 },
    { province: 'Sumatera Utara', researchers: 950, avgImpact: 72.4, institutions: 34, topField: 'Kedokteran', lat: 3.5, lng: 98.7 },
    { province: 'Sulawesi Selatan', researchers: 780, avgImpact: 71.5, institutions: 28, topField: 'Pertanian', lat: -5.1, lng: 119.4 }
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
  
  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      
      {/* Sub-Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto">
          <ul className="flex flex-wrap space-x-1 md:space-x-8 p-4">
            <li>
              <button 
                className={`font-medium ${activeTab === 'dashboard' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-600 hover:text-blue-700'}`}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </button>
            </li>
            <li>
              <button 
                className={`font-medium ${activeTab === 'articleImpact' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-600 hover:text-blue-700'}`}
                onClick={() => setActiveTab('articleImpact')}
              >
                Dampak Artikel
              </button>
            </li>
            <li>
              <button 
                className={`font-medium ${activeTab === 'researcherImpact' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-600 hover:text-blue-700'}`}
                onClick={() => setActiveTab('researcherImpact')}
              >
                Peneliti Terkemuka
              </button>
            </li>
            <li>
              <button 
                className={`font-medium ${activeTab === 'researcherMap' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-600 hover:text-blue-700'}`}
                onClick={() => setActiveTab('researcherMap')}
              >
                Peta Distribusi
              </button>
            </li>
            <li>
              <button 
                className={`font-medium ${activeTab === 'trends' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-600 hover:text-blue-700'}`}
                onClick={() => setActiveTab('trends')}
              >
                Tren & Analisis
              </button>
            </li>
          </ul>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="container mx-auto">
        {/* Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Statistik Ringkasan */}
            <div className="bg-white p-4 rounded-lg shadow col-span-3 mb-4">
              <h2 className="text-lg font-semibold mb-4">Ringkasan Penelitian Indonesia</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Total Peneliti</p>
                  <p className="text-2xl font-bold text-blue-700">24,580</p>
                  <p className="text-xs text-green-600">+5.2% dari tahun lalu</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Total Publikasi</p>
                  <p className="text-2xl font-bold text-green-700">156,842</p>
                  <p className="text-xs text-green-600">+8.7% dari tahun lalu</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Total Sitasi</p>
                  <p className="text-2xl font-bold text-yellow-700">2.4M+</p>
                  <p className="text-xs text-green-600">+12.3% dari tahun lalu</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Dampak Rata-rata</p>
                  <p className="text-2xl font-bold text-indigo-700">74.6</p>
                  <p className="text-xs text-green-600">+3.8% dari tahun lalu</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Kolaborasi Global</p>
                  <p className="text-2xl font-bold text-purple-700">43.5%</p>
                  <p className="text-xs text-green-600">+7.2% dari tahun lalu</p>
                </div>
              </div>
            </div>
            
            {/* Dampak Berdasarkan Bidang Studi */}
            <div className="bg-white p-4 rounded-lg shadow col-span-3 lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Dampak Penelitian Berdasarkan Bidang</h2>
                <select 
                  className="text-sm border rounded p-1"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <option value="all">Semua Waktu</option>
                  <option value="year">1 Tahun Terakhir</option>
                  <option value="3years">3 Tahun Terakhir</option>
                  <option value="5years">5 Tahun Terakhir</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={researchImpactByField}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="field" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="researcherCount" fill="#8884d8" name="Jumlah Peneliti" />
                  <Line yAxisId="right" type="monotone" dataKey="avgImpact" stroke="#82ca9d" name="Dampak Rata-rata" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            {/* Distribusi Peneliti */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Distribusi Peneliti di Indonesia</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={provinceResearcherData.slice(0, 7)}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="researchers"
                    nameKey="province"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {provinceResearcherData.slice(0, 7).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [value, props.payload.province]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 text-center">
                <button 
                  className="text-blue-600 text-sm hover:text-blue-800"
                  onClick={() => setActiveTab('researcherMap')}
                >
                  Lihat Peta Lengkap
                </button>
              </div>
            </div>
            
            {/* Peneliti Terkemuka */}
            <div className="bg-white p-4 rounded-lg shadow col-span-3 lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Peneliti Terkemuka di Indonesia</h2>
                <button 
                  className="text-blue-600 text-sm hover:text-blue-800"
                  onClick={() => setActiveTab('researcherImpact')}
                >
                  Lihat Semua
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peneliti</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Afiliasi</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">H-Index</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sitasi</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skor Dampak</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topResearchersData.map(researcher => (
                      <tr key={researcher.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{researcher.name}</div>
                          <div className="text-xs text-gray-500">{researcher.field}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{researcher.affiliation}</div>
                          <div className="text-xs text-gray-500">{researcher.location}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {researcher.hIndex}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {researcher.citations.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${researcher.impactScore}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm font-medium text-gray-900">{researcher.impactScore}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Artikel dengan Dampak Tertinggi */}
            <div className="bg-white p-4 rounded-lg shadow col-span-3 lg:col-span-1">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Artikel Dampak Tertinggi</h2>
                <button 
                  className="text-blue-600 text-sm hover:text-blue-800"
                  onClick={() => setActiveTab('articleImpact')}
                >
                  Lihat Semua
                </button>
              </div>
              <ul className="space-y-3">
                {topArticlesData.slice(0, 3).map(article => (
                  <li key={article.id} className="border-b pb-3">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{article.title}</h3>
                    <p className="text-xs text-gray-600 mt-1">{article.authors}</p>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">{article.journal} ({article.year})</span>
                      <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {article.impactScore}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Tren Dampak Penelitian */}
            <div className="bg-white p-4 rounded-lg shadow col-span-3">
              <h2 className="text-lg font-semibold mb-4">Tren Dampak Penelitian (2019-2024)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={impactTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="akademik" stackId="1" stroke="#8884d8" fill="#8884d8" name="Dampak Akademik" />
                  <Area type="monotone" dataKey="sosial" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Dampak Media Sosial" />
                  <Area type="monotone" dataKey="praktis" stackId="1" stroke="#ffc658" fill="#ffc658" name="Dampak Penggunaan Praktis" />
                  <Line type="monotone" dataKey="total" stroke="#ff7300" name="Skor Dampak Total" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>

    {/* Footer */}
    <footer className="bg-gray-100 p-4 mt-6">
      <div className="container mx-auto text-center text-sm text-gray-600">
        <p>© 2025 Scieco Indonesia - Platform Analisis Dampak Penelitian Indonesia</p>
        <p className="mt-1">Versi 1.0 - Dikembangkan oleh Tim Scieco Indonesia</p>
      </div>
    </footer>

    </main>
  );
};

export default SciecoDashboard;