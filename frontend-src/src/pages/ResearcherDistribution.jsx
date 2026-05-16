import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart } from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Data Database (single source of truth) ────────────────────────────────────

const RESEARCH_FIELDS = {
  all: { label: 'Semua Bidang', value: 'all' },
  ti: { label: 'Teknologi Informasi', value: 'ti' },
  med: { label: 'Kedokteran', value: 'med' },
  agr: { label: 'Pertanian', value: 'agr' },
  eng: { label: 'Teknik', value: 'eng' },
  soc: { label: 'Sosial Ekonomi', value: 'soc' },
};

const provinceResearcherData = [
  { province: 'DKI Jakarta', researchers: 2584, avgImpact: 82.4, institutions: 58, topField: 'Teknologi Informasi', lat: -6.2, lng: 106.8, fields: { ti: 850, med: 450, agr: 200, eng: 650, soc: 434 } },
  { province: 'Jawa Barat', researchers: 2150, avgImpact: 79.2, institutions: 72, topField: 'Teknik', lat: -6.9, lng: 107.6, fields: { ti: 520, med: 380, agr: 650, eng: 510, soc: 90 } },
  { province: 'Jawa Timur', researchers: 1960, avgImpact: 77.5, institutions: 68, topField: 'Pertanian', lat: -7.5, lng: 112.7, fields: { ti: 450, med: 520, agr: 700, eng: 180, soc: 110 } },
  { province: 'Jawa Tengah', researchers: 1845, avgImpact: 76.8, institutions: 65, topField: 'Pendidikan', lat: -7.1, lng: 110.4, fields: { ti: 420, med: 650, agr: 380, eng: 250, soc: 145 } },
  { province: 'DI Yogyakarta', researchers: 1520, avgImpact: 81.2, institutions: 42, topField: 'Sosial Ekonomi', lat: -7.8, lng: 110.3, fields: { ti: 380, med: 590, agr: 200, eng: 200, soc: 150 } },
  { province: 'Sumatera Utara', researchers: 950, avgImpact: 72.4, institutions: 34, topField: 'Kedokteran', lat: 3.5, lng: 98.7, fields: { ti: 200, med: 550, agr: 100, eng: 80, soc: 20 } },
  { province: 'Sulawesi Selatan', researchers: 780, avgImpact: 71.5, institutions: 28, topField: 'Pertanian', lat: -5.1, lng: 119.4, fields: { ti: 150, med: 250, agr: 300, eng: 60, soc: 20 } },
  { province: 'Bali', researchers: 640, avgImpact: 74.8, institutions: 18, topField: 'Pariwisata', lat: -8.4, lng: 115.1, fields: { ti: 120, med: 180, agr: 180, eng: 100, soc: 60 } },
  { province: 'Sumatera Barat', researchers: 580, avgImpact: 70.2, institutions: 15, topField: 'Pertanian', lat: -0.9, lng: 100.3, fields: { ti: 80, med: 120, agr: 250, eng: 90, soc: 40 } },
  { province: 'Kalimantan Timur', researchers: 420, avgImpact: 69.5, institutions: 12, topField: 'Lingkungan', lat: 0.5, lng: 116.4, fields: { ti: 100, med: 90, agr: 150, eng: 60, soc: 20 } },
];

const institutionData = [
  { id: 1, name: 'Universitas Indonesia', province: 'DKI Jakarta', researchers: 587, avgImpact: 82.3, publications: 4250, topField: 'Teknologi Informasi', lat: -6.36, lng: 106.83 },
  { id: 2, name: 'Institut Teknologi Bandung', province: 'Jawa Barat', researchers: 521, avgImpact: 80.7, publications: 3980, topField: 'Teknik', lat: -6.89, lng: 107.61 },
  { id: 3, name: 'Universitas Gadjah Mada', province: 'DI Yogyakarta', researchers: 492, avgImpact: 79.8, publications: 3750, topField: 'Kedokteran', lat: -7.77, lng: 110.38 },
  { id: 4, name: 'Institut Pertanian Bogor', province: 'Jawa Barat', researchers: 435, avgImpact: 77.2, publications: 3240, topField: 'Pertanian', lat: -6.56, lng: 106.72 },
  { id: 5, name: 'Universitas Airlangga', province: 'Jawa Timur', researchers: 412, avgImpact: 78.5, publications: 3120, topField: 'Kedokteran', lat: -7.27, lng: 112.78 },
  { id: 6, name: 'Universitas Hasanuddin', province: 'Sulawesi Selatan', researchers: 374, avgImpact: 74.2, publications: 2840, topField: 'Kesehatan', lat: -5.13, lng: 119.49 },
  { id: 7, name: 'Universitas Diponegoro', province: 'Jawa Tengah', researchers: 356, avgImpact: 76.8, publications: 2650, topField: 'Teknik', lat: -7.05, lng: 110.44 },
  { id: 8, name: 'Universitas Padjadjaran', province: 'Jawa Barat', researchers: 340, avgImpact: 77.9, publications: 2580, topField: 'Sosial', lat: -6.92, lng: 107.77 },
  { id: 9, name: 'Universitas Brawijaya', province: 'Jawa Timur', researchers: 328, avgImpact: 76.3, publications: 2460, topField: 'Pertanian', lat: -7.95, lng: 112.61 },
  { id: 10, name: 'Universitas Sumatera Utara', province: 'Sumatera Utara', researchers: 287, avgImpact: 74.7, publications: 2180, topField: 'Teknik', lat: 3.56, lng: 98.65 },
];

const regionalDistributionData = [
  { region: 'Jawa', avgImpact: 78.5, researchers: 9524 },
  { region: 'Sumatera', avgImpact: 72.4, researchers: 2845 },
  { region: 'Sulawesi', avgImpact: 70.5, researchers: 1532 },
  { region: 'Kalimantan', avgImpact: 68.2, researchers: 965 },
  { region: 'Bali & NT', avgImpact: 74.8, researchers: 842 },
  { region: 'Maluku & Papua', avgImpact: 65.3, researchers: 398 },
];

// ─── Komponen Map (ekstrak keluar fungsi induk) ────────────────────────────────

const ResearcherMap = ({ mapView, selectedField, geoData }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) {
      const style = document.createElement('style');
      style.textContent = `
        .leaflet-div-icon-transparent { background: transparent !important; border: none !important; }
        .leaflet-tooltip.researcher-tooltip {
          background-color: rgba(255, 255, 255, 0.95) !important;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
          border-radius: 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 0.75rem;
        }
        .leaflet-tooltip.researcher-tooltip::before { display: none; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const mapPoints = mapView === 'institution'
    ? institutionData.map(inst => ({
        lat: inst.lat,
        lng: inst.lng,
        name: inst.name,
        value: inst.researchers,
        type: 'institution',
        extra: `${inst.province} • ${inst.topField}`,
      }))
    : geoData.map(prov => ({
        lat: prov.lat,
        lng: prov.lng,
        name: prov.province,
        value: prov.researchers,
        type: 'province',
        extra: `${prov.institutions} institusi • ${prov.topField}`,
      }));

  return (
    <div className="h-96 rounded-xl overflow-hidden border border-gray-200 bg-white">
      <MapContainer
        ref={mapRef}
        center={[-2.5, 113.5]}
        zoom={4}
        minZoom={3}
        maxZoom={6}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        scrollWheelZoom={true}
        dragging={true}
        zoomControl={true}
        doubleClickZoom={true}
        touchZoom={true}
        worldCopyJump={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {mapPoints.map((pt, i) => (
          <CircleMarker
            key={i}
            center={[pt.lat, pt.lng]}
            radius={Math.max(6, Math.min(18, Math.floor(pt.value / 30)))}
            pathOptions={{
              color: pt.type === 'institution' ? '#ef4444' : '#3b82f6',
              fillColor: pt.type === 'institution' ? '#ef4444' : '#3b82f6',
              fillOpacity: 0.7,
              weight: 2,
            }}
          >
            <LeafletTooltip className="researcher-tooltip" permanent={false} direction="top">
              <div className="text-xs">
                <p className="font-bold text-gray-900">{pt.name}</p>
                <p className="text-gray-600">{pt.value.toLocaleString('id-ID')} peneliti</p>
                <p className="text-gray-500">{pt.extra}</p>
              </div>
            </LeafletTooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

// ─── Komponen Utama ──────────────────────────────────────────────────────────

const ResearcherDistribution = () => {
  const [activeTab, setActiveTab] = useState('distribution');
  const [mapView, setMapView] = useState('province');
  const [selectedField, setSelectedField] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState(null);

  // Filter data berdasarkan selectedField
  const getFilteredProvinceData = () => {
    if (selectedField === 'all') return provinceResearcherData;

    return provinceResearcherData.map(prov => {
      const fieldCount = prov.fields[selectedField] || 0;
      return {
        ...prov,
        researchers: fieldCount,
        avgImpact: prov.avgImpact * (fieldCount / Object.values(prov.fields).reduce((a, b) => a + b, 0)),
      };
    }).filter(p => p.researchers > 0);
  };

  const getFilteredInstitutionData = () => {
    if (selectedField === 'all') return institutionData;
    // Simulasi: filter institusi yang memiliki bidang yang dipilih
    const fieldMap = {
      ti: ['Teknologi Informasi', 'Informatika'],
      med: ['Kedokteran', 'Kesehatan', 'Farmasi'],
      agr: ['Pertanian', 'Peternakan'],
      eng: ['Teknik', 'Engineering'],
      soc: ['Sosial', 'Ekonomi', 'Sosial Ekonomi'],
    };
    const fieldsToMatch = fieldMap[selectedField] || [];
    return institutionData.filter(inst => fieldsToMatch.some(f => inst.topField.includes(f)));
  };

  const filteredProvinceData = getFilteredProvinceData();
  const filteredInstitutionData = getFilteredInstitutionData();
  const displayData = mapView === 'province' ? filteredProvinceData : filteredInstitutionData;

  // Statistik agregat
  const totalResearchers = displayData.reduce((sum, item) => sum + item.researchers, 0);
  const avgImpact = (displayData.reduce((sum, item) => sum + item.avgImpact, 0) / displayData.length).toFixed(1);

  // Data provinsi terpilih untuk detail panel
  const selectedProvinceData = selectedProvince
    ? provinceResearcherData.find(p => p.province === selectedProvince)
    : null;

  // Tab content yang berubah berdasarkan activeTab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'distribution':
        return (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">Total Peneliti</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{totalResearchers.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                <p className="text-sm text-green-600 font-medium">Rata-rata Dampak</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{avgImpact}%</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                <p className="text-sm text-purple-600 font-medium">Total Lokasi</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">{displayData.length}</p>
              </div>
            </div>

            {/* Peta */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Peta Distribusi Geografis</h3>
              <ResearcherMap mapView={mapView} selectedField={selectedField} geoData={filteredProvinceData} />
            </div>

            {/* Tabel data */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {mapView === 'province' ? 'Statistik per Provinsi' : 'Statistik per Institusi'}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{mapView === 'province' ? 'Provinsi' : 'Institusi'}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Peneliti</th>
                      {mapView === 'province' && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Institusi</th>}
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bidang Dominan</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dampak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayData.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedProvince(item.province)}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {item.name || item.province}
                          {item.province && <p className="text-xs text-gray-500">{item.province}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{item.researchers.toLocaleString('id-ID')}</td>
                        {mapView === 'province' && <td className="px-4 py-3 text-gray-700">{item.institutions}</td>}
                        <td className="px-4 py-3 text-gray-700 text-sm">{item.topField}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${item.avgImpact}%` }} />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{item.avgImpact.toFixed(1)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detail provinsi */}
            {selectedProvinceData && (
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Detail: {selectedProvinceData.province}</h3>
                  <button
                    onClick={() => setSelectedProvince(null)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Top Institusi</h4>
                    <ul className="space-y-2">
                      {institutionData
                        .filter(inst => inst.province === selectedProvinceData.province)
                        .slice(0, 5)
                        .map(inst => (
                          <li key={inst.id} className="flex justify-between text-sm">
                            <span className="text-gray-700">{inst.name}</span>
                            <span className="font-medium text-blue-600">{inst.researchers} peneliti</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Distribusi Bidang</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedProvinceData.fields).map(([field, count]) => {
                        const total = Object.values(selectedProvinceData.fields).reduce((a, b) => a + b, 0);
                        const pct = ((count / total) * 100).toFixed(1);
                        return (
                          <div key={field} className="flex justify-between text-sm items-center">
                            <span className="text-gray-700 capitalize">{RESEARCH_FIELDS[field]?.label}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded h-2">
                                <div className="bg-blue-500 h-2 rounded" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="font-medium text-gray-700 text-xs">{pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'trends':
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tren Regional</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={regionalDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="region" />
                <YAxis yAxisId="left" stroke="#3b82f6" />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="researchers" fill="#3b82f6" name="Jumlah Peneliti" radius={[8, 8, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="avgImpact" stroke="#10b981" name="Rata-rata Dampak" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );

      case 'impact':
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ranking Dampak Peneliti</h3>
            <div className="space-y-3">
              {provinceResearcherData
                .sort((a, b) => b.avgImpact - a.avgImpact)
                .slice(0, 8)
                .map((prov, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-gray-300 w-8">{idx + 1}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{prov.province}</p>
                      <p className="text-xs text-gray-500">{prov.researchers} peneliti</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-green-600">{prov.avgImpact}%</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-12">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium">Distribusi Peneliti</span>
      </nav>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 mb-6 rounded-t-xl sticky top-24 z-10">
        <div className="flex gap-1 px-6">
          {[
            { id: 'distribution', label: 'Distribusi' },
            { id: 'impact', label: 'Dampak' },
            { id: 'trends', label: 'Tren' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-blue-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Filter Bidang</label>
          <select
            value={selectedField}
            onChange={(e) => {
              setSelectedField(e.target.value);
              setSelectedProvince(null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Object.entries(RESEARCH_FIELDS).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>

        {activeTab === 'distribution' && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Tingkat Detail</label>
            <div className="flex gap-2">
              <button
                onClick={() => setMapView('province')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mapView === 'province'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Provinsi
              </button>
              <button
                onClick={() => setMapView('institution')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mapView === 'institution'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Institusi
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Konten Tab */}
      {renderTabContent()}
    </main>
  );
};

export default ResearcherDistribution;
