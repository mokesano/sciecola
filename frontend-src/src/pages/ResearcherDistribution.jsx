import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const ResearcherDistribution = () => {
  const [activeTab, setActiveTab] = useState('researcherMap');
  const [mapView, setMapView] = useState('province');
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalResearchers, setTotalResearchers] = useState(null);
  const [provinceResearcherData, setProvinceResearcherData] = useState([]);
  const [institutionData, setInstitutionData] = useState([]);
  const [worldGeoJson, setWorldGeoJson] = useState(null);
  const mapRef = useRef(null);

  // Fetch data dari database (GLOBAL - semua negara, tidak hanya Indonesia)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch country-level data (SEMUA negara di dunia)
        const countryRes = await fetch('/api/researcher_distribution.php?groupBy=country');
        const countryJson = await countryRes.json();
        if (countryJson.status === 'success') {
          setProvinceResearcherData(countryJson.data.map(item => ({
            province: item.name,  // Nama negara: Indonesia, Malaysia, USA, dll
            researchers: item.researchers,
            avgImpact: item.avgImpact,
            institutions: item.institutions,
            topField: item.topField,
            publications: item.publications,
            lat: item.lat,  // Dari API (global coordinates)
            lng: item.lng,  // Dari API (global coordinates)
            fields: { ti: 0, med: 0, agr: 0, eng: 0, soc: 0 }
          })));
        }

        // Fetch institution-level data (institusi dari mana saja)
        const instRes = await fetch('/api/researcher_distribution.php?groupBy=institution');
        const instJson = await instRes.json();
        if (instJson.status === 'success') {
          setInstitutionData(instJson.data.map(item => ({
            id: item.id,
            name: item.name,
            country: item.country,
            researchers: item.researchers,
            avgImpact: item.avgImpact,
            publications: item.publications,
            topField: item.topField,
            lat: item.lat || 0,
            lng: item.lng || 0
          })));
        }

        // Fetch total researchers
        const statsRes = await fetch('/api/platform_stats.php');
        const statsJson = await statsRes.json();
        if (statsJson.status === 'success') {
          const researcherStat = statsJson.data.find(s => s.label === 'Peneliti');
          if (researcherStat) setTotalResearchers(researcherStat.value);
        }

        // Fetch world GeoJSON untuk choropleth
        const geoRes = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson');
        const geoJson = await geoRes.json();
        setWorldGeoJson(geoJson);
      } catch (e) {
        console.error('Error fetching data:', e);
      }
    };

    fetchData();
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
  
  // Hitung center peta berdasarkan distribusi data peneliti global
  const calculateMapCenter = () => {
    if (provinceResearcherData.length === 0) {
      return { lat: 20, lng: 0 }; // Default: pusat Dunia
    }

    // Rata-rata koordinat dari semua negara dengan peneliti
    const avgLat = provinceResearcherData.reduce((sum, item) => sum + item.lat, 0) / provinceResearcherData.length;
    const avgLng = provinceResearcherData.reduce((sum, item) => sum + item.lng, 0) / provinceResearcherData.length;

    return { lat: avgLat, lng: avgLng };
  };

  const mapCenter = calculateMapCenter();

  // Fungsi untuk mengubah tampilan peta
  const toggleMapView = (view) => {
    setLoading(true);
    setMapView(view);
    setTimeout(() => setLoading(false), 500); // Simulasi loading
  };

  // Use full data (field filtering disabled - API doesn't provide field-level breakdown)
  const filteredProvinceData = provinceResearcherData;
  const filteredInstitutionData = institutionData;

  // Data untuk detail panel provinsi
  const selectedProvinceData = selectedProvince
    ? provinceResearcherData.find(p => p.province === selectedProvince)
    : null;

  // Helper: Warna choropleth berdasarkan jumlah peneliti (skala biru)
  const getChoroplethColor = (count, maxCount) => {
    if (!count || count === 0) return '#f5f5f5';
    const ratio = count / maxCount;
    if (ratio > 0.8) return '#084594';
    if (ratio > 0.6) return '#2171b5';
    if (ratio > 0.4) return '#4292c6';
    if (ratio > 0.2) return '#6baed6';
    if (ratio > 0.1) return '#9ecae1';
    return '#c6dbef';
  };

  // Komponen untuk update map view ketika mapView berubah
  const MapViewController = ({ view }) => {
    const map = useMap();
    useEffect(() => {
      if (view === 'province') {
        map.setView([20, 0], 2); // World overview untuk choropleth
      }
    }, [view, map]);
    return null;
  };

  // Peta Distribusi: Choropleth (negara) atau Marker (institusi)
  const ResearcherMap = ({ geoData, institutionList }) => {
    // Lookup: nama negara → jumlah peneliti
    const researcherByCountry = {};
    geoData.forEach(item => { researcherByCountry[item.province] = item.researchers; });
    const maxCount = Math.max(...geoData.map(d => d.researchers), 1);

    // Style tiap negara di GeoJSON berdasarkan jumlah peneliti
    const countryStyle = (feature) => {
      const name = feature.properties.ADMIN || feature.properties.name || '';
      const count = researcherByCountry[name] || 0;
      return {
        fillColor: getChoroplethColor(count, maxCount),
        weight: 0.8,
        opacity: 1,
        color: '#aaa',
        fillOpacity: count > 0 ? 0.85 : 0.3,
      };
    };

    // Tooltip saat hover negara
    const onEachCountry = (feature, layer) => {
      const name = feature.properties.ADMIN || feature.properties.name || 'Unknown';
      const count = researcherByCountry[name] || 0;
      layer.bindTooltip(
        `<div style="font-size:12px"><strong>${name}</strong><br/>${count.toLocaleString('id-ID')} peneliti</div>`,
        { sticky: true, direction: 'top' }
      );
      if (count > 0) {
        layer.on('click', () => setSelectedProvince(name));
      }
    };

    return (
      <div className="h-96 overflow-hidden border border-gray-200">
        <MapContainer
          ref={mapRef}
          center={[20, 0]}
          zoom={2}
          minZoom={2}
          maxZoom={6}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          scrollWheelZoom={true}
          dragging={true}
          zoomControl={true}
          doubleClickZoom={true}
          touchZoom={true}
          worldCopyJump={true}
          attributionControl={false}
        >
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png" 
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

          <MapViewController view={mapView} />

          {/* CHOROPLETH: Warna negara berdasarkan jumlah peneliti */}
          {mapView === 'province' && worldGeoJson && (
            <GeoJSON
              key={mapView}
              data={worldGeoJson}
              style={countryStyle}
              onEachFeature={onEachCountry}
            />
          )}

          {/* MARKERS: Titik institusi per negara */}
          {mapView === 'institution' && institutionList.map((inst, i) => (
            <CircleMarker
              key={i}
              center={[inst.lat, inst.lng]}
              radius={Math.max(5, Math.min(20, Math.sqrt(inst.researchers) * 1.5))}
              pathOptions={{
                color: '#1d4ed8',
                fillColor: '#3b82f6',
                fillOpacity: 0.75,
                weight: 1.5,
              }}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-sm text-gray-900">{inst.name}</p>
                  <p className="text-xs text-gray-500">{inst.country}</p>
                  <p className="text-xs text-gray-600 mt-1">{inst.researchers.toLocaleString('id-ID')} peneliti</p>
                  <p className="text-xs text-gray-600">{inst.publications?.toLocaleString('id-ID') || 0} publikasi</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Legend choropleth */}
        {mapView === 'province' && (
          <div className="flex items-center gap-2 mt-2 px-1 flex-wrap">
            <span className="text-xs text-gray-500">Peneliti:</span>
            {[
              { color: '#f5f5f5', label: '0' },
              { color: '#c6dbef', label: 'Sedikit' },
              { color: '#6baed6', label: 'Sedang' },
              { color: '#2171b5', label: 'Banyak' },
              { color: '#084594', label: 'Tertinggi' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1">
                <div className="w-4 h-3 rounded-sm border border-gray-300" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-12">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">Distribusi Peneliti Global</span>
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
        <h2 className="text-lg font-semibold">Peta Distribusi Peneliti Global</h2>
        <div className="flex flex-wrap gap-2">
          <div className="flex">
            <button
              className={`px-4 py-2 text-sm rounded-l-md ${mapView === 'province' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => toggleMapView('province')}
            >
              Provinsi
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-r-md ${mapView === 'institution' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
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
          {mapView === 'province' ? 'Statistik Peneliti per Negara' : 'Statistik Peneliti per Institusi'}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {mapView === 'province' ? 'Negara' : 'Institusi'}
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

      {/* Detail Negara yang Dipilih */}
      {selectedProvinceData && (
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <h3 className="text-md font-semibold">Detail Negara: {selectedProvinceData.province}</h3>
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
