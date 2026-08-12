import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Line, AreaChart, Area, ComposedChart, Bar,
} from 'recharts';

import {
  TOP_ARTICLES_DATA, TOP_RESEARCHERS_DATA, RESEARCH_IMPACT_BY_FIELD,
  DASHBOARD_IMPACT_TRENDS, PROVINCE_RESEARCHER_DATA, DASHBOARD_COLORS,
} from '../data/mock/dashboardMock';

const TABS = ['dashboard', 'articleImpact', 'researcherImpact', 'researcherMap', 'trends'];

// Summary tiles: values are mock until a real stats endpoint lands.
const SUMMARY_TILES = [
  { key: 'researchers',   value: '24,580',  yoy: '+5.2%',  bg: 'bg-blue-50',   text: 'text-blue-700'   },
  { key: 'publications',  value: '156,842', yoy: '+8.7%',  bg: 'bg-green-50',  text: 'text-green-700'  },
  { key: 'citations',     value: '2.4M+',   yoy: '+12.3%', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  { key: 'avg_impact',    value: '74.6',    yoy: '+3.8%',  bg: 'bg-indigo-50', text: 'text-indigo-700' },
  { key: 'global_collab', value: '43.5%',   yoy: '+7.2%',  bg: 'bg-purple-50', text: 'text-purple-700' },
];

const SciecoDashboard = () => {
  const { t } = useTranslation('scieco_dashboard');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeRange, setTimeRange] = useState('all');

  const topArticlesData       = TOP_ARTICLES_DATA;
  const topResearchersData    = TOP_RESEARCHERS_DATA;
  const researchImpactByField = RESEARCH_IMPACT_BY_FIELD;
  const impactTrends          = DASHBOARD_IMPACT_TRENDS;
  const provinceResearcherData = PROVINCE_RESEARCHER_DATA;
  const COLORS = DASHBOARD_COLORS;

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

      {/* Sub-Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto">
          <ul className="flex flex-wrap space-x-1 md:space-x-8 p-4">
            {TABS.map(tab => (
              <li key={tab}>
                <button
                  className={`font-medium ${activeTab === tab ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-600 hover:text-blue-700'}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {t(`tabs.${tab}`)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Dashboard Overview */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Statistik Ringkasan */}
          <div className="bg-white p-4 rounded-lg shadow col-span-3 mb-4">
            <h2 className="text-lg font-semibold mb-4">{t('summary_title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {SUMMARY_TILES.map(tile => (
                <div key={tile.key} className={`${tile.bg} p-4 rounded-lg text-center`}>
                  <p className="text-[15px] text-gray-500">{t(`summary.${tile.key}`)}</p>
                  <p className={`text-2xl font-bold ${tile.text}`}>{tile.value}</p>
                  <p className="text-sm text-green-600">{t('summary_yoy', { pct: tile.yoy })}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dampak Berdasarkan Bidang Studi */}
          <div className="bg-white p-4 rounded-lg shadow col-span-3 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{t('impact_by_field_title')}</h2>
              <select
                className="text-[15px] border rounded p-1"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="all">{t('time_range.all')}</option>
                <option value="year">{t('time_range.year')}</option>
                <option value="3years">{t('time_range.3years')}</option>
                <option value="5years">{t('time_range.5years')}</option>
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
                <Bar yAxisId="left" dataKey="researcherCount" fill="#8884d8" name={t('chart.researcher_count')} />
                <Line yAxisId="right" type="monotone" dataKey="avgImpact" stroke="#82ca9d" name={t('chart.avg_impact')} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Distribusi Peneliti */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">{t('distribution_title')}</h2>
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
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
                className="text-blue-600 text-[15px] hover:text-blue-800"
                onClick={() => setActiveTab('researcherMap')}
              >
                {t('view_full_map')}
              </button>
            </div>
          </div>

          {/* Peneliti Terkemuka */}
          <div className="bg-white p-4 rounded-lg shadow col-span-3 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{t('top_researchers_title')}</h2>
              <button
                className="text-blue-600 text-[15px] hover:text-blue-800"
                onClick={() => setActiveTab('researcherImpact')}
              >
                {t('view_all')}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">{t('table.researcher')}</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">{t('table.affiliation')}</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">{t('table.hindex')}</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">{t('table.citations')}</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">{t('table.impact')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topResearchersData.map(researcher => (
                    <tr key={researcher.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-[15px] font-medium text-gray-900">{researcher.name}</div>
                        <div className="text-sm text-gray-500">{researcher.field}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-[15px] text-gray-900">{researcher.affiliation}</div>
                        <div className="text-sm text-gray-500">{researcher.location}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-[15px] text-gray-900">{researcher.hIndex}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[15px] text-gray-900">{researcher.citations.toLocaleString()}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${researcher.impactScore}%` }}></div>
                          </div>
                          <span className="ml-2 text-[15px] font-medium text-gray-900">{researcher.impactScore}</span>
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
              <h2 className="text-lg font-semibold">{t('top_articles_title')}</h2>
              <button
                className="text-blue-600 text-[15px] hover:text-blue-800"
                onClick={() => setActiveTab('articleImpact')}
              >
                {t('view_all')}
              </button>
            </div>
            <ul className="space-y-3">
              {topArticlesData.slice(0, 3).map(article => (
                <li key={article.id} className="border-b pb-3">
                  <h3 className="text-[15px] font-medium text-gray-900 line-clamp-2">{article.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{article.authors}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-sm text-gray-500">{article.journal} ({article.year})</span>
                    <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {article.impactScore}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Tren Dampak Penelitian */}
          <div className="bg-white p-4 rounded-lg shadow col-span-3">
            <h2 className="text-lg font-semibold mb-4">{t('trends_title')}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={impactTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="akademik" stackId="1" stroke="#8884d8" fill="#8884d8" name={t('trend_series.academic')} />
                <Area type="monotone" dataKey="sosial"   stackId="1" stroke="#82ca9d" fill="#82ca9d" name={t('trend_series.social_media')} />
                <Area type="monotone" dataKey="praktis"  stackId="1" stroke="#ffc658" fill="#ffc658" name={t('trend_series.practical')} />
                <Line type="monotone" dataKey="total" stroke="#ff7300" name={t('trend_series.total')} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </main>
  );
};

export default SciecoDashboard;