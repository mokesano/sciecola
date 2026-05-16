import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const ResearcherDistribution = () => {
  const [activeTab, setActiveTab] = useState('researcherMap');
  const [mapView, setMapView] = useState('province');
  const [selectedField, setSelectedField] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalResearchers, setTotalResearchers] = useState(null);
  const [provinceResearcherData, setProvinceResearcherData] = useState([]);
  const [institutionData, setInstitutionData] = useState([]);

  // Fetch data dari database
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch country-level data
        const countryRes = await fetch('/api/researcher_distribution.php?groupBy=country');
        const countryJson = await countryRes.json();
        if (countryJson.status === 'success') {
          setProvinceResearcherData(countryJson.data.map(item => ({
            province: item.name,
            researchers: item.researchers,
            avgImpact: item.avgImpact,
            institutions: item.institutions,
            topField: item.topField,
            publications: item.publications,
            lat: getCoordinate(item.name).lat,
            lng: getCoordinate(item.name).lng,
            fields: { ti: 0, med: 0, agr: 0, eng: 0, soc: 0 }
          })));
        }

        // Fetch institution-level data
        const instRes = await fetch('/api/researcher_distribution.php?groupBy=institution');
        const instJson = await instRes.json();
        if (instJson.status === 'success') {
          setInstitutionData(instJson.data.map(item => ({
            id: item.id,
            name: item.name,
            province: item.country,
            researchers: item.researchers,
            avgImpact: item.avgImpact,
            publications: item.publications,
            topField: item.topField,
            lat: getCoordinate(item.country).lat,
            lng: getCoordinate(item.country).lng
          })));
        }

        // Fetch total researchers
        const statsRes = await fetch('/api/platform_stats.php');
        const statsJson = await statsRes.json();
        if (statsJson.status === 'success') {
          const researcherStat = statsJson.data.find(s => s.label === 'Peneliti');
          if (researcherStat) setTotalResearchers(researcherStat.value);
        }
      } catch (e) {
        console.error('Error fetching data:', e);
      }
    };

    fetchData();
  }, []);

  // Pemetaan koordinat untuk negara/wilayah
  const getCoordinate = (location) => {
    const coords = {
      'Indonesia': { lat: -2.5, lng: 113.5 },
      'Malaysia': { lat: 4.2, lng: 101.6 },
      'Philippines': { lat: 11.8, lng: 122.9 },
      'Thailand': { lat: 15.8, lng: 100.9 },
      'Vietnam': { lat: 14.0, lng: 107.9 },
      'DKI Jakarta': { lat: -6.2, lng: 106.8 },
      'Jawa Barat': { lat: -6.9, lng: 107.6 },
      'Jawa Timur': { lat: -7.5, lng: 112.7 },
    };
    return coords[location] || { lat: 0, lng: 0 };
  };

  // Fungsi untuk mengubah tampilan peta
  const toggleMapView = (view) => {
    setLoading(true);
    setMapView(view);
    setTimeout(() => setLoading(false), 500); // Simulasi loading
  };

  // Fungsi untuk memfilter data berdasarkan bidang
  const filterByField = (field) => {
    setSelectedField(field);
    setSelectedProvince(null);
  };

  // Filter data berdasarkan selectedField (FIX P2: map dan tabel harus pakai data yang sama)
  const fieldMap = {
    ti: ['Teknologi Informasi', 'Informatika'],
    med: ['Kedokteran', 'Kesehatan', 'Farmasi'],
    agr: ['Pertanian', 'Peternakan'],
    eng: ['Teknik', 'Engineering'],
    soc: ['Sosial', 'Ekonomi', 'Sosial Ekonomi'],
  };

  const filteredProvinceData = selectedField === 'all'
    ? provinceResearcherData
    : provinceResearcherData.map(prov => ({
        ...prov,
        researchers: prov.fields[selectedField] || 0,
      })).filter(p => p.researchers > 0);

  const filteredInstitutionData = selectedField === 'all'
    ? institutionData
    : institutionData.filter(inst =>
        (fieldMap[selectedField] || []).some(f => inst.topField.includes(f))
      );

  // Data untuk detail panel provinsi
  const selectedProvinceData = selectedProvince
    ? provinceResearcherData.find(p => p.province === selectedProvince)
    : null;

  // Komponen peta Indonesia interaktif
  // World researcher distribution map (FIX P2: gunakan data yang sudah difilter)
  const ResearcherMap = ({ geoData, institutionList }) => {
    const mapPoints = mapView === 'institution'
      ? institutionList.map(inst => ({
          lat: inst.lat, lng: inst.lng,
          name: inst.name, researchers: inst.researchers, type: 'institution'
        }))
      : [
          ...geoData.map(prov => ({
            lat: prov.lat, lng: prov.lng,
            name: prov.province, researchers: prov.researchers, type: 'province'
          })),
          { lat: 51.51, lng: -0.13, name: 'UCL (Collaborator)', researchers: 12, type: 'collaborator' },
          { lat: 35.68, lng: 139.69, name: 'University of Tokyo (Collaborator)', researchers: 8, type: 'collaborator' },
          { lat: 1.35, lng: 103.82, name: 'NUS (Collaborator)', researchers: 15, type: 'collaborator' },
          { lat: 40.71, lng: -74.01, name: 'Columbia University (Collaborator)', researchers: 6, type: 'collaborator' },
        ];

    return (
      <div className="h-96 rounded-xl overflow-hidden border border-gray-200">
        <MapContainer
          center={[10, 115]}
          zoom={3}
          minZoom={2}
          maxZoom={6}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
          dragging={false}
          zoomControl={false}
          doubleClickZoom={false}
          touchZoom={false}
          keyboard={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          />
          {mapPoints.map((pt, i) => (
            <CircleMarker
              key={i}
              center={[pt.lat, pt.lng]}
              radius={Math.max(5, Math.min(16, Math.floor(pt.researchers / 40)))}
              pathOptions={{
                color: pt.type === 'collaborator' ? '#6366f1' : '#ef4444',
                fillColor: pt.type === 'collaborator' ? '#6366f1' : '#ef4444',
                fillOpacity: 0.6,
                weight: 1.5,
              }}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-sm text-gray-900">{pt.name}</p>
                  <p className="text-xs text-gray-600">{pt.researchers} researchers</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    );
  };

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-12">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">Institusi</span>
      </nav>

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

    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-2 md:space-y-0">
        <h2 className="text-lg font-semibold">Peta Distribusi Peneliti Indonesia</h2>
        <div className="flex flex-wrap gap-2">
          <select
            className="border rounded px-2 py-1 text-sm"
            value={selectedField}
            onChange={(e) => filterByField(e.target.value)}
          >
            <option value="all">Semua Bidang</option>
            <option value="ti">Teknologi Informasi</option>
            <option value="med">Kedokteran</option>
            <option value="agr">Pertanian</option>
            <option value="eng">Teknik</option>
            <option value="soc">Sosial Ekonomi</option>
          </select>

          <div className="flex">
            <button
              className={`px-3 py-1 text-sm rounded-l-md ${mapView === 'province' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => toggleMapView('province')}
            >
              Provinsi
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-r-md ${mapView === 'institution' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => toggleMapView('institution')}
            >
              Institusi
            </button>
          </div>
        </div>
      </div>

      {/* Peta Interaktif */}
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <ResearcherMap geoData={filteredProvinceData} institutionList={filteredInstitutionData} />
      )}

      {/* Statistik Peneliti */}
      <div className="mt-6">
        <h3 className="text-md font-semibold mb-4">
          {mapView === 'province' ? 'Statistik Peneliti per Provinsi' : 'Statistik Peneliti per Institusi'}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {mapView === 'province' ? 'Provinsi' : 'Institusi'}
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah Peneliti
                </th>
                {mapView === 'province' && (
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah Institusi
                  </th>
                )}
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bidang Dominan
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rata-rata Dampak
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mapView === 'province' ? (
                filteredProvinceData.map((province, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedProvince(province.province)}
                  >
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {province.province}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {province.researchers.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {province.institutions}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {province.topField}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${province.avgImpact}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{province.avgImpact}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                filteredInstitutionData.map((institution) => (
                  <tr key={institution.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{institution.name}</div>
                      <div className="text-xs text-gray-500">{institution.province}</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {institution.researchers.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {institution.topField}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${institution.avgImpact}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{institution.avgImpact}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grafik Distribusi Regional */}
      <div className="mt-6">
        <h3 className="text-md font-semibold mb-4">Distribusi Dampak Regional</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={[
              { region: 'Jawa', avgImpact: 78.5, researchers: 9524 },
              { region: 'Sumatera', avgImpact: 72.4, researchers: 2845 },
              { region: 'Sulawesi', avgImpact: 70.5, researchers: 1532 },
              { region: 'Kalimantan', avgImpact: 68.2, researchers: 965 },
              { region: 'Bali & NT', avgImpact: 74.8, researchers: 842 },
              { region: 'Maluku & Papua', avgImpact: 65.3, researchers: 398 }
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="region" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="researchers" fill="#8884d8" name="Jumlah Peneliti" />
            <Bar yAxisId="right" dataKey="avgImpact" fill="#82ca9d" name="Rata-rata Dampak" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detail Provinsi yang Dipilih */}
      {selectedProvinceData && (
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <h3 className="text-md font-semibold">Detail Provinsi: {selectedProvinceData.province}</h3>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedProvince(null)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">
                <b>Top 5 Institusi:</b>
              </p>
              <ul className="mt-1 text-sm">
                {institutionData
                  .filter(inst => inst.province === selectedProvinceData.province)
                  .slice(0, 5)
                  .map(institution => (
                    <li key={institution.id} className="flex justify-between py-1">
                      <span>{institution.name}</span>
                      <span className="font-medium">{institution.researchers} peneliti</span>
                    </li>
                  ))}
              </ul>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                <b>Statistik Lokasi:</b>
              </p>
              <div className="mt-1 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Peneliti</span>
                  <span className="font-medium">{selectedProvinceData.researchers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jumlah Institusi</span>
                  <span className="font-medium">{selectedProvinceData.institutions}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rata-rata Dampak</span>
                  <span className="font-medium">{selectedProvinceData.avgImpact}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Publikasi</span>
                  <span className="font-medium">{(selectedProvinceData.publications || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    </main>
  );
};

export default ResearcherDistribution;
