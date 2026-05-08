import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ResearcherDistribution = () => {
  const [activeTab, setActiveTab] = useState('researcherMap');
  // State
  const [mapView, setMapView] = useState('province');
  const [selectedField, setSelectedField] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Data untuk peta peneliti
  const provinceResearcherData = [
    { province: 'DKI Jakarta', researchers: 2584, avgImpact: 82.4, institutions: 58, topField: 'Teknologi Informasi', lat: -6.2, lng: 106.8 },
    { province: 'Jawa Barat', researchers: 2150, avgImpact: 79.2, institutions: 72, topField: 'Teknik', lat: -6.9, lng: 107.6 },
    { province: 'Jawa Timur', researchers: 1960, avgImpact: 77.5, institutions: 68, topField: 'Pertanian', lat: -7.5, lng: 112.7 },
    { province: 'Jawa Tengah', researchers: 1845, avgImpact: 76.8, institutions: 65, topField: 'Pendidikan', lat: -7.1, lng: 110.4 },
    { province: 'DI Yogyakarta', researchers: 1520, avgImpact: 81.2, institutions: 42, topField: 'Sosial Ekonomi', lat: -7.8, lng: 110.3 },
    { province: 'Sumatera Utara', researchers: 950, avgImpact: 72.4, institutions: 34, topField: 'Kedokteran', lat: 3.5, lng: 98.7 },
    { province: 'Sulawesi Selatan', researchers: 780, avgImpact: 71.5, institutions: 28, topField: 'Pertanian', lat: -5.1, lng: 119.4 },
    { province: 'Bali', researchers: 640, avgImpact: 74.8, institutions: 18, topField: 'Pariwisata', lat: -8.4, lng: 115.1 },
    { province: 'Sumatera Barat', researchers: 580, avgImpact: 70.2, institutions: 15, topField: 'Pertanian', lat: -0.9, lng: 100.3 },
    { province: 'Kalimantan Timur', researchers: 420, avgImpact: 69.5, institutions: 12, topField: 'Lingkungan', lat: 0.5, lng: 116.4 }
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
    { id: 10, name: 'Universitas Sumatera Utara', province: 'Sumatera Utara', researchers: 287, avgImpact: 74.7, publications: 2180, topField: 'Teknik', lat: 3.56, lng: 98.65 }
  ];
  
  // Fungsi untuk mengubah tampilan peta
  const toggleMapView = (view) => {
    setLoading(true);
    setMapView(view);
    setTimeout(() => setLoading(false), 500); // Simulasi loading
  };
  
  // Fungsi untuk memfilter data berdasarkan bidang
  const filterByField = (field) => {
    setSelectedField(field);
    // Implementasi filter akan ditambahkan di sini
  };
  
  // Komponen peta Indonesia interaktif
  const IndonesiaMap = () => {
    return (
      <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-lg font-medium text-gray-700">Peta Interaktif Distribusi Peneliti Indonesia</p>
          <p className="text-sm text-gray-500 mt-2">
            Di implementasi sebenarnya, komponen ini akan menampilkan:
          </p>
          <ul className="text-sm text-gray-500 text-left mt-2 space-y-1">
            <li>• Peta Indonesia dengan data geolokasi peneliti</li>
            <li>• Visualisasi heatmap sebaran peneliti</li>
            <li>• Marker untuk lokasi institusi</li>
            <li>• Popup detail saat mengklik wilayah</li>
          </ul>
        </div>
      </div>
    );
  };
  
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
        <IndonesiaMap />
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
                provinceResearcherData.map((province, index) => (
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
                institutionData.map((institution) => (
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
      {selectedProvince && (
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <h3 className="text-md font-semibold">Detail Provinsi: {selectedProvince}</h3>
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
                  .filter(inst => inst.province === selectedProvince)
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
                <b>Statistik Bidang Penelitian:</b>
              </p>
              <div className="mt-1 space-y-2">
                <div className="text-sm flex justify-between">
                  <span>Teknologi Informasi</span>
                  <span>32%</span>
                </div>
                <div className="text-sm flex justify-between">
                  <span>Kedokteran</span>
                  <span>28%</span>
                </div>
                <div className="text-sm flex justify-between">
                  <span>Teknik</span>
                  <span>22%</span>
                </div>
                <div className="text-sm flex justify-between">
                  <span>Sosial Ekonomi</span>
                  <span>18%</span>
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