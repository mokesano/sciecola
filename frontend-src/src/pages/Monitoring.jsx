import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, Marker, Tooltip, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { adminFetch } from '../utils/adminFetch';

const Monitoring = () => {
  const { t } = useTranslation('monitoring');
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [monitoringData, setMonitoringData] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    fetchMonitoringData(selectedTimeRange);
  }, [selectedTimeRange]);

  const fetchMonitoringData = async (range) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminFetch(`/api/monitoring.php?range=${range}`);
      if (!response.ok) throw new Error('Failed to fetch monitoring data');
      const result = await response.json();
      if (result.status === 'ok' && result.data) {
        setMonitoringData(result.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Monitoring data fetch error:', err);
      setError(err.message);
      // Tidak memakai data contoh saat gagal: tampilan kosong + pesan error
    } finally {
      setLoading(false);
    }
  };

  // Animasi pulse halus (subtle)
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes subtle-pulse {
        0% { transform: scale(1); opacity: 0.6; }
        100% { transform: scale(2.5); opacity: 0; }
      }
      .pulse-wrapper { position: relative; width: 100%; height: 100%; }
      .pulse-core { position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 50%; }
      .pulse-ring { position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 50%; animation: subtle-pulse 2.5s ease-out infinite; }
      .leaflet-div-icon-transparent { background: transparent !important; border: none !important; }
      
      .leaflet-tooltip.custom-map-tooltip {
        background-color: rgba(255, 255, 255, 0.4) !important;
        backdrop-filter: blur(6px); /* Efek blur pada peta di belakangnya */
        -webkit-backdrop-filter: blur(6px); /* Dukungan untuk Safari */
        border: 1px solid rgba(255, 255, 255, 0.4) !important;
        border-radius: 0.75rem; 
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
        padding: 0.5rem 0.75rem;
      }
      .leaflet-tooltip.custom-map-tooltip::before { display: none; }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const MapSizeFixer = () => {
    const map = useMap();
    useEffect(() => {
      const timeout = setTimeout(() => {
        map.invalidateSize();
      }, 250);
      return () => clearTimeout(timeout);
    }, [map]);
    return null;
  };


  const geoData = monitoringData?.geoData || [];


  const trafficSources = monitoringData?.trafficSources || { sources: [], utm: [], referrers: [], keywords: [] };


  const pagesData = monitoringData?.pagesData || { entryPages: [], topPages: [], exitPages: [] };


  const systemData = monitoringData?.systemData || { browsers: [], platforms: [], os: [] };


  const pageViewActivity = monitoringData?.activity || [];

  const formatSeconds = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const PulseMarker = ({ position, city, visitors, type = 'normal' }) => {
    // Menggunakan Opsi 1 (Seimbang) untuk visual ukuran pulse
    const radius = Math.max(5, Math.min(14, Math.floor(visitors / 90))); 
    const color = type === 'brute' ? '#ef4444' : '#3b82f6';
    const size = radius * 2;

    const customIcon = L.divIcon({
      className: 'leaflet-div-icon-transparent',
      html: `
        <div className="pulse-wrapper">
          <div className="pulse-ring" style="background-color: ${color};"></div>
          <div className="pulse-core" style="background-color: ${color};"></div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2], 
      tooltipAnchor: [0, -size / 2] // Mengganti popupAnchor menjadi tooltipAnchor
    });

    return (
      <Marker position={position} icon={customIcon}>
        {/* Menggunakan Tooltip: Muncul saat hover, tidak menggeser layar, dan arah auto menyesuaikan batas tepi layar */}
        <Tooltip 
          direction="auto" 
          opacity={1} 
          className="custom-map-tooltip"
        >
          <div className="min-w-[120px]">
            <p className="font-bold text-gray-900 text-[15px] mb-0.5">{city}</p>
            <p className="text-sm text-gray-600 mb-1">{visitors.toLocaleString()} visitors</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
              <p className="text-xs font-medium text-gray-700">
                {type === 'brute' ? 'Brute Force' : type === 'bot' ? 'Bot Visit' : 'Normal Visit'}
              </p>
            </div>
          </div>
        </Tooltip>
      </Marker>
    );
  };

  const ProgressBar = ({ percentage, color }) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={`${color} h-2 rounded-full transition-all duration-500`} 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );

  const StatCard = ({ title, value, change, icon, color }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[15px] text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-[15px] text-gray-600 mt-1">{t('header.subtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[15px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="1h">{t('range.1h')}</option>
                <option value="24h">{t('range.24h')}</option>
                <option value="7d">{t('range.7d')}</option>
                <option value="30d">{t('range.30d')}</option>
              </select>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[15px] font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('action.refresh')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
              <p className="text-gray-700 font-medium">{t('loading')}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{t('error_prefix')} {error}. {t('error_suffix')}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">{t('geo.title')}</h2>
            <p className="text-[15px] text-gray-600 mt-1">{t('geo.subtitle')}</p>
          </div>
          <div className="h-[580px] w-full z-0 relative">
            <MapContainer
              ref={mapRef}
              center={[20, 0]}
              zoom={2}
              minZoom={2}
              maxZoom={6}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              scrollWheelZoom={false}
              dragging={true}
              zoomControl={true}
              doubleClickZoom={true}
              touchZoom={true}
              worldCopyJump={true}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                subdomains="abcd"
                maxZoom={19}
                noWrap={false}
              />
              <MapSizeFixer />
              {geoData.map((location) => (
                <PulseMarker
                  key={location.id}
                  position={[location.lat, location.lng]}
                  city={location.city}
                  visitors={location.visitors}
                  type={location.visitors > 1000 ? 'brute' : location.visitors > 500 ? 'bot' : 'normal'}
                />
              ))}
            </MapContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t('stats.page_views')}
            value={monitoringData?.summary?.totalPageViews?.toLocaleString() || '—'}
            change={12.5}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
            color="bg-indigo-500"
          />
          <StatCard
            title={t('stats.visitors')}
            value={monitoringData?.summary?.uniqueVisitors?.toLocaleString() || '—'}
            change={8.3}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
            color="bg-purple-500"
          />
          <StatCard
            title={t('stats.session')}
            value={formatSeconds(monitoringData?.summary?.avgSessionDuration) || '—'}
            change={-2.1}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            color="bg-green-500"
          />
          <StatCard
            title={t('stats.bounce')}
            value={(monitoringData?.summary?.bounceRate != null ? monitoringData.summary.bounceRate.toFixed(1) + '%' : '—')}
            change={-5.7}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
            color="bg-amber-500"
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">{t('panel.by_source')}</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-[15px] font-semibold text-gray-700 mb-2">{t('sections.sources')}</h4>
                <div className="space-y-2">
                  {trafficSources.sources.map((source, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${source.color}`}></div>
                      <div className="flex-1">
                        <div className="flex justify-between text-[15px] mb-1">
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
                <h4 className="text-[15px] font-semibold text-gray-700 mb-2">{t('panel.campaigns')}</h4>
                <div className="space-y-2">
                  {trafficSources.utm.map((utm, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[15px]">
                      <span className="text-gray-700">{utm.campaign}</span>
                      <span className="text-gray-900 font-medium">{utm.value} ({utm.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">{t('panel.by_pages')}</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-[15px] font-semibold text-gray-700 mb-2">{t('sections.top_pages')}</h4>
                <div className="space-y-2">
                  {pagesData.topPages.slice(0, 4).map((page, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[15px] p-2 bg-gray-50 rounded">
                      <span className="text-gray-700 truncate flex-1">{page.path}</span>
                      <span className="text-gray-900 font-medium ml-4">{page.views.toLocaleString()}</span>
                      <span className="text-gray-500 text-sm ml-2">{page.avgTime}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-[15px] font-semibold text-gray-700 mb-2">{t('sections.entry_pages')}</h4>
                <div className="space-y-2">
                  {pagesData.entryPages.slice(0, 3).map((page, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[15px]">
                      <span className="text-gray-700">{page.path}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 text-sm">Bounce: {page.bounceRate}</span>
                        <span className="text-gray-900 font-medium">{page.views.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">{t('sections.browsers')}</h3>
            <div className="space-y-3">
              {systemData.browsers.map((browser, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] text-gray-700">{browser.name}</span>
                  </div>
                  <span className="text-[15px] font-medium text-gray-900">{browser.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">{t('sections.platforms')}</h3>
            <div className="space-y-3">
              {systemData.platforms.map((platform, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] text-gray-700">{platform.name}</span>
                  </div>
                  <span className="text-[15px] font-medium text-gray-900">{platform.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">{t('sections.os')}</h3>
            <div className="space-y-3">
              {systemData.os.map((os, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] text-gray-700">{os.name}</span>
                  </div>
                  <span className="text-[15px] font-medium text-gray-900">{os.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('activity.title')}</h2>
              <p className="text-[15px] text-gray-600 mt-1">{t('activity.subtitle')}</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-[15px] text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                {t('action.export')}
              </button>
              <button className="px-3 py-1.5 text-[15px] bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors">
                {t('action.view_all')}
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">{t('table.timestamp')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.page')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.source')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.location')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.device')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.duration')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageViewActivity.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-900 font-mono text-[15px]">{activity.timestamp}</td>
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
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[15px] font-medium">
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