import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix untuk default icon Leaflet yang hilang di React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Monitoring = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [activeTab, setActiveTab] = useState('overview');

  // Mock Data: Geographic Distribution dengan node berdenyut
  const [geoData, setGeoData] = useState([
    { id: 1, lat: -6.2088, lng: 106.8456, city: 'Jakarta', visitors: 1247, pulse: true },
    { id: 2, lat: -7.2575, lng: 112.7521, city: 'Surabaya', visitors: 856, pulse: true },
    { id: 3, lat: -6.9175, lng: 107.6191, city: 'Bandung', visitors: 734, pulse: false },
    { id: 4, lat: -8.6705, lng: 115.2126, city: 'Denpasar', visitors: 623, pulse: true },
    { id: 5, lat: -7.7956, lng: 110.3695, city: 'Yogyakarta', visitors: 512, pulse: false },
    { id: 6, lat: -5.1477, lng: 119.4327, city: 'Makassar', visitors: 445, pulse: true },
    { id: 7, lat: -3.3194, lng: 114.5906, city: 'Banjarmasin', visitors: 334, pulse: false },
    { id: 8, lat: -0.5017, lng: 117.1536, city: 'Balikpapan', visitors: 289, pulse: true },
  ]);

  // Mock Data: Traffic Sources
  const trafficSources = {
    sources: [
      { name: 'Direct', value: 4523, percentage: 35, color: 'bg-indigo-500' },
      { name: 'Organic Search', value: 3845, percentage: 30, color: 'bg-purple-500' },
      { name: 'Social Media', value: 2156, percentage: 17, color: 'bg-pink-500' },
      { name: 'Referral', value: 1234, percentage: 10, color: 'bg-blue-500' },
      { name: 'Email', value: 987, percentage: 8, color: 'bg-green-500' },
    ],
    utm: [
      { campaign: 'SDG_Campaign_2024', value: 1567, percentage: 45 },
      { campaign: 'Research_Promo', value: 1023, percentage: 29 },
      { campaign: 'Webinar_March', value: 678, percentage: 19 },
      { campaign: 'Newsletter_Q1', value: 245, percentage: 7 },
    ],
    referrers: [
      { domain: 'google.com', value: 2345, percentage: 42 },
      { domain: 'linkedin.com', value: 1234, percentage: 22 },
      { domain: 'twitter.com', value: 987, percentage: 18 },
      { domain: 'facebook.com', value: 567, percentage: 10 },
      { domain: 'others', value: 456, percentage: 8 },
    ],
    keywords: [
      { keyword: 'SDG analysis', value: 1234, percentage: 28 },
      { keyword: 'research analytics', value: 987, percentage: 22 },
      { keyword: 'wizdam platform', value: 756, percentage: 17 },
      { keyword: 'academic tools', value: 534, percentage: 12 },
      { keyword: 'others', value: 923, percentage: 21 },
    ]
  };

  // Mock Data: Pages Analytics
  const pagesData = {
    entryPages: [
      { path: '/dashboard', views: 3456, percentage: 32, bounceRate: '24%' },
      { path: '/researchers', views: 2345, percentage: 22, bounceRate: '31%' },
      { path: '/sdgs', views: 1876, percentage: 17, bounceRate: '28%' },
      { path: '/journals', views: 1234, percentage: 11, bounceRate: '35%' },
      { path: '/about', views: 987, percentage: 9, bounceRate: '42%' },
    ],
    topPages: [
      { path: '/dashboard/analytics', views: 5678, avgTime: '4m 32s', exits: 234 },
      { path: '/researchers/profile', views: 4321, avgTime: '3m 18s', exits: 187 },
      { path: '/sdgs/explorer', views: 3456, avgTime: '5m 12s', exits: 156 },
      { path: '/journals/list', views: 2345, avgTime: '2m 45s', exits: 123 },
      { path: '/api/docs', views: 1876, avgTime: '6m 05s', exits: 89 },
    ],
    exitPages: [
      { path: '/dashboard', views: 1234, percentage: 28 },
      { path: '/researchers', views: 987, percentage: 22 },
      { path: '/logout', views: 756, percentage: 17 },
      { path: '/sdgs', views: 534, percentage: 12 },
      { path: '/contact', views: 423, percentage: 9 },
    ]
  };

  // Mock Data: System Analytics
  const systemData = {
    browsers: [
      { name: 'Chrome', value: 6789, percentage: 58, icon: '🌐' },
      { name: 'Firefox', value: 2345, percentage: 20, icon: '🦊' },
      { name: 'Safari', value: 1567, percentage: 13, icon: '🧭' },
      { name: 'Edge', value: 987, percentage: 8, icon: '🔷' },
      { name: 'Others', value: 123, percentage: 1, icon: '📱' },
    ],
    platforms: [
      { name: 'Desktop', value: 7654, percentage: 65, icon: '💻' },
      { name: 'Mobile', value: 3456, percentage: 29, icon: '📱' },
      { name: 'Tablet', value: 701, percentage: 6, icon: '📲' },
    ],
    screens: [
      { resolution: '1920x1080', value: 4567, percentage: 39 },
      { resolution: '1366x768', value: 3456, percentage: 29 },
      { resolution: '1440x900', value: 1876, percentage: 16 },
      { resolution: '360x640', value: 1234, percentage: 10 },
      { resolution: 'Others', value: 678, percentage: 6 },
    ],
    os: [
      { name: 'Windows', value: 6789, percentage: 58, icon: '🪟' },
      { name: 'macOS', value: 2345, percentage: 20, icon: '🍎' },
      { name: 'Android', value: 1567, percentage: 13, icon: '🤖' },
      { name: 'iOS', value: 987, percentage: 8, icon: '📱' },
      { name: 'Linux', value: 123, percentage: 1, icon: '🐧' },
    ],
    devices: [
      { name: 'Desktop', value: 7654, percentage: 65 },
      { name: 'Smartphone', value: 3234, percentage: 27 },
      { name: 'Tablet', value: 701, percentage: 6 },
      { name: 'Smart TV', value: 123, percentage: 1 },
      { name: 'Console', value: 99, percentage: 1 },
    ]
  };

  // Mock Data: Page View Activity (Detail)
  const [pageViewActivity, setPageViewActivity] = useState([
    { id: 1, timestamp: '2024-05-25 14:32:15', page: '/dashboard/analytics', source: 'google.com', location: 'Jakarta', device: 'Chrome/Windows', duration: '4m 32s' },
    { id: 2, timestamp: '2024-05-25 14:31:48', page: '/researchers/profile', source: 'Direct', location: 'Surabaya', device: 'Firefox/macOS', duration: '3m 18s' },
    { id: 3, timestamp: '2024-05-25 14:30:22', page: '/sdgs/explorer', source: 'linkedin.com', location: 'Bandung', device: 'Chrome/Android', duration: '5m 12s' },
    { id: 4, timestamp: '2024-05-25 14:29:55', page: '/journals/list', source: 'twitter.com', location: 'Denpasar', device: 'Safari/iOS', duration: '2m 45s' },
    { id: 5, timestamp: '2024-05-25 14:28:33', page: '/api/docs', source: 'google.com', location: 'Jakarta', device: 'Chrome/Windows', duration: '6m 05s' },
    { id: 6, timestamp: '2024-05-25 14:27:12', page: '/dashboard', source: 'Direct', location: 'Yogyakarta', device: 'Edge/Windows', duration: '1m 23s' },
    { id: 7, timestamp: '2024-05-25 14:26:45', page: '/about', source: 'facebook.com', location: 'Makassar', device: 'Chrome/Android', duration: '0m 45s' },
    { id: 8, timestamp: '2024-05-25 14:25:18', page: '/researchers', source: 'google.com', location: 'Jakarta', device: 'Firefox/Linux', duration: '3m 56s' },
  ]);

  // Custom Pulse Marker Component
  const PulseMarker = ({ position, city, visitors, pulse }) => {
    return (
      <CircleMarker
        center={position}
        radius={pulse ? 12 : 8}
        color={pulse ? '#6366f1' : '#8b5cf6'}
        fillColor={pulse ? '#6366f1' : '#8b5cf6'}
        fillOpacity={0.6}
        weight={2}
        className={pulse ? 'animate-pulse' : ''}
      >
        <Popup>
          <div className="p-2">
            <p className="font-bold text-gray-900">{city}</p>
            <p className="text-sm text-gray-600">{visitors.toLocaleString()} visitors</p>
          </div>
        </Popup>
      </CircleMarker>
    );
  };

  // Progress Bar Component
  const ProgressBar = ({ percentage, color }) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={`${color} h-2 rounded-full transition-all duration-500`} 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );

  // Card Component
  const StatCard = ({ title, value, change, icon, color }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-xs mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% dari periode sebelumnya
            </p>
          )}
        </div>
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Activity Monitoring</h1>
              <p className="text-sm text-gray-600 mt-1">Real-time monitoring aktivitas dan trafik aplikasi</p>
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="1h">1 Jam Terakhir</option>
                <option value="24h">24 Jam Terakhir</option>
                <option value="7d">7 Hari Terakhir</option>
                <option value="30d">30 Hari Terakhir</option>
              </select>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Page Views"
            value="12,847"
            change={12.5}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
            color="bg-indigo-500"
          />
          <StatCard 
            title="Unique Visitors"
            value="3,456"
            change={8.3}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
            color="bg-purple-500"
          />
          <StatCard 
            title="Avg. Session"
            value="4m 32s"
            change={-2.1}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            color="bg-green-500"
          />
          <StatCard 
            title="Bounce Rate"
            value="32.4%"
            change={-5.7}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
            color="bg-amber-500"
          />
        </div>

        {/* Geographic Map */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Geographic Distribution</h2>
            <p className="text-sm text-gray-600 mt-1">Distribusi pengunjung berdasarkan lokasi geografis</p>
          </div>
          <div className="h-96">
            <MapContainer 
              center={[-2.5489, 118.0149]} 
              zoom={5} 
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution={`&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>`}
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {geoData.map((location) => (
                <PulseMarker 
                  key={location.id}
                  position={[location.lat, location.lng]}
                  city={location.city}
                  visitors={location.visitors}
                  pulse={location.pulse}
                />
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Traffic Sources & Pages Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* By Traffic Source */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">By Traffic Source</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Sources</h4>
                <div className="space-y-2">
                  {trafficSources.sources.map((source, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${source.color}`}></div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{source.name}</span>
                          <span className="text-gray-900 font-medium">{source.value.toLocaleString()}</span>
                        </div>
                        <ProgressBar percentage={source.percentage} color={source.color} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">UTM Campaigns</h4>
                <div className="space-y-2">
                  {trafficSources.utm.map((utm, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{utm.campaign}</span>
                      <span className="text-gray-900 font-medium">{utm.value} ({utm.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* By Pages */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">By Pages</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Pages</h4>
                <div className="space-y-2">
                  {pagesData.topPages.slice(0, 4).map((page, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                      <span className="text-gray-700 truncate flex-1">{page.path}</span>
                      <span className="text-gray-900 font-medium ml-4">{page.views.toLocaleString()}</span>
                      <span className="text-gray-500 text-xs ml-2">{page.avgTime}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Entry Pages</h4>
                <div className="space-y-2">
                  {pagesData.entryPages.slice(0, 3).map((page, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{page.path}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 text-xs">Bounce: {page.bounceRate}</span>
                        <span className="text-gray-900 font-medium">{page.views.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Browsers */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Browsers</h3>
            <div className="space-y-3">
              {systemData.browsers.map((browser, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{browser.icon}</span>
                    <span className="text-sm text-gray-700">{browser.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{browser.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Platforms</h3>
            <div className="space-y-3">
              {systemData.platforms.map((platform, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{platform.icon}</span>
                    <span className="text-sm text-gray-700">{platform.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{platform.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* OS */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Operating Systems</h3>
            <div className="space-y-3">
              {systemData.os.map((os, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{os.icon}</span>
                    <span className="text-sm text-gray-700">{os.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{os.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Page View Activity Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Page View Activity</h2>
              <p className="text-sm text-gray-600 mt-1">Detail aktivitas pengunjung secara real-time</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Export CSV
              </button>
              <button className="px-3 py-1.5 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors">
                View All
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Timestamp</th>
                  <th className="px-4 py-3 text-left font-medium">Page</th>
                  <th className="px-4 py-3 text-left font-medium">Source</th>
                  <th className="px-4 py-3 text-left font-medium">Location</th>
                  <th className="px-4 py-3 text-left font-medium">Device</th>
                  <th className="px-4 py-3 text-left font-medium">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageViewActivity.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-900 font-mono text-xs">{activity.timestamp}</td>
                    <td className="px-4 py-3">
                      <span className="text-indigo-600 font-medium">{activity.page}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{activity.source}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-gray-700">{activity.location}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{activity.device}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        {activity.duration}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};

export default Monitoring;