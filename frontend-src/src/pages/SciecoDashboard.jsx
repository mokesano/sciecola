import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ComposedChart
} from 'recharts';

import {
  TOP_ARTICLES_DATA, TOP_RESEARCHERS_DATA, RESEARCH_IMPACT_BY_FIELD, IMPACT_COMPONENTS,
  DASHBOARD_IMPACT_TRENDS, PROVINCE_RESEARCHER_DATA, DASHBOARD_COLORS
} from '../data/mock/dashboardMock';

const SciecoDashboard = () => {
  // State untuk tab aktif dan filter
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mapView, setMapView] = useState('province');
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedField, setSelectedField] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('all');
  
  const topArticlesData = TOP_ARTICLES_DATA;
  const topResearchersData = TOP_RESEARCHERS_DATA;
  const researchImpactByField = RESEARCH_IMPACT_BY_FIELD;
  const impactComponents = IMPACT_COMPONENTS;
  const impactTrends = DASHBOARD_IMPACT_TRENDS;
  const provinceResearcherData = PROVINCE_RESEARCHER_DATA;
  const COLORS = DASHBOARD_COLORS;
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
  );
};

export default SciecoDashboard;