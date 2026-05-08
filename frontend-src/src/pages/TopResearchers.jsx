import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const TopResearchers = () => {
  // State management
  const [selectedField, setSelectedField] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [sortBy, setSortBy] = useState('impactScore');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedResearcher, setSelectedResearcher] = useState(null);
  
  // Data for top researchers
  const topResearchersData = [
    {
      id: 1,
      name: 'Prof. Dr. Slamet Wijaya',
      affiliation: 'Universitas Indonesia',
      department: 'Fakultas Ilmu Komputer',
      field: 'Teknologi Informasi',
      location: 'Jakarta',
      province: 'DKI Jakarta',
      hIndex: 28,
      i10Index: 42,
      citations: 3240,
      publications: 87,
      collaborations: 34,
      domesticCollabs: 25,
      internationalCollabs: 9,
      researchGrants: 12,
      impactScore: 92.5,
      topPublications: [
        { title: 'Implementasi Deep Learning untuk Pengenalan Pola Batik Indonesia', journal: 'Jurnal Informatika Indonesia', year: 2023, citations: 28 },
        { title: 'Optimasi Jaringan Saraf Tiruan untuk Klasifikasi Citra Medis', journal: 'Jurnal Ilmu Komputer', year: 2022, citations: 42 },
        { title: 'Analisis Big Data untuk Prediksi Penyebaran Penyakit Menular', journal: 'Jurnal Kesehatan Digital', year: 2021, citations: 35 }
      ]
    },
    {
      id: 2,
      name: 'Dr. Ratna Handayani',
      affiliation: 'Institut Teknologi Bandung',
      department: 'Fakultas Ekonomi dan Bisnis',
      field: 'Sosial Ekonomi',
      location: 'Bandung',
      province: 'Jawa Barat',
      hIndex: 24,
      i10Index: 36,
      citations: 2850,
      publications: 74,
      collaborations: 29,
      domesticCollabs: 22,
      internationalCollabs: 7,
      researchGrants: 9,
      impactScore: 89.7,
      topPublications: [
        { title: 'Analisis Ketahanan Pangan di Wilayah Pesisir Menghadapi Perubahan Iklim', journal: 'Jurnal Ketahanan Nasional', year: 2023, citations: 22 },
        { title: 'Ekonomi Kerakyatan dalam Pembangunan Daerah Tertinggal', journal: 'Jurnal Ekonomi Indonesia', year: 2021, citations: 38 },
        { title: 'Model Pengembangan UMKM Berbasis Teknologi Digital', journal: 'Jurnal Manajemen Bisnis', year: 2022, citations: 27 }
      ]
    },
    {
      id: 3,
      name: 'Prof. Dr. Budi Santoso',
      affiliation: 'Universitas Gadjah Mada',
      department: 'Fakultas Kedokteran',
      field: 'Kedokteran',
      location: 'Yogyakarta',
      province: 'DI Yogyakarta',
      hIndex: 26,
      i10Index: 39,
      citations: 3120,
      publications: 82,
      collaborations: 41,
      domesticCollabs: 27,
      internationalCollabs: 14,
      researchGrants: 15,
      impactScore: 88.3,
      topPublications: [
        { title: 'Deteksi Dini Penyakit Tropis Menggunakan Algoritma Machine Learning', journal: 'Jurnal Kedokteran Indonesia', year: 2024, citations: 19 },
        { title: 'Pola Resistensi Antibiotik pada Bakteri Patogen di Indonesia', journal: 'Jurnal Mikrobiologi Kedokteran', year: 2022, citations: 45 },
        { title: 'Epidemiologi Penyakit Dengue di Kawasan Urban Indonesia', journal: 'Jurnal Epidemiologi Nasional', year: 2021, citations: 38 }
      ]
    },
    {
      id: 4,
      name: 'Dr. Tri Kusuma',
      affiliation: 'Institut Pertanian Bogor',
      department: 'Fakultas Pertanian',
      field: 'Pertanian',
      location: 'Bogor',
      province: 'Jawa Barat',
      hIndex: 21,
      i10Index: 32,
      citations: 2340,
      publications: 65,
      collaborations: 27,
      domesticCollabs: 22,
      internationalCollabs: 5,
      researchGrants: 8,
      impactScore: 85.9,
      topPublications: [
        { title: 'Pengembangan Material Nano-komposit dari Limbah Pertanian untuk Filtrasi Air', journal: 'Jurnal Teknik Kimia Indonesia', year: 2024, citations: 15 },
        { title: 'Optimasi Hasil Panen Padi dengan Pendekatan Pertanian Presisi', journal: 'Jurnal Agronomi Indonesia', year: 2022, citations: 32 },
        { title: 'Penggunaan Drone untuk Monitoring Kesehatan Tanaman Pangan', journal: 'Jurnal Teknologi Pertanian', year: 2023, citations: 24 }
      ]
    },
    {
      id: 5,
      name: 'Prof. Dr. Hadi Wijaya',
      affiliation: 'Universitas Airlangga',
      department: 'Fakultas Teknik Kimia',
      field: 'Kimia',
      location: 'Surabaya',
      province: 'Jawa Timur',
      hIndex: 23,
      i10Index: 35,
      citations: 2680,
      publications: 71,
      collaborations: 32,
      domesticCollabs: 24,
      internationalCollabs: 8,
      researchGrants: 10,
      impactScore: 84.2,
      topPublications: [
        { title: 'Sintesis Bioplastik dari Pati Singkong dengan Penambahan Kitosan', journal: 'Jurnal Polimer Indonesia', year: 2023, citations: 21 },
        { title: 'Ekstraksi dan Karakterisasi Senyawa Bioaktif dari Tanaman Obat Indonesia', journal: 'Jurnal Bahan Alam Indonesia', year: 2022, citations: 36 },
        { title: 'Pengembangan Katalis Heterogen untuk Produksi Biodiesel', journal: 'Jurnal Energi Terbarukan', year: 2021, citations: 29 }
      ]
    }
  ];
  
  // Distribution data for statistics
  const researcherDistributionByField = [
    { field: 'Teknologi Informasi', count: 1246, avgImpact: 82.4 },
    { field: 'Kedokteran', count: 1582, avgImpact: 79.8 },
    { field: 'Pertanian', count: 1124, avgImpact: 74.5 },
    { field: 'Teknik', count: 986, avgImpact: 77.2 },
    { field: 'Sosial Ekonomi', count: 875, avgImpact: 72.6 },
    { field: 'Pendidikan', count: 942, avgImpact: 71.9 }
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const ITEMS_PER_PAGE = 5;
  const TOTAL_RESEARCHERS = 24580;
  
  // Filter and sort researchers
  const filteredResearchers = useMemo(() => {
    return topResearchersData
      .filter(researcher => {
        const fieldMatch = selectedField === 'all' || 
          (selectedField === 'ti' && researcher.field === 'Teknologi Informasi') ||
          (selectedField === 'med' && researcher.field === 'Kedokteran') ||
          (selectedField === 'agr' && researcher.field === 'Pertanian') ||
          (selectedField === 'eng' && researcher.field === 'Teknik') ||
          (selectedField === 'soc' && researcher.field === 'Sosial Ekonomi');
        
        const provinceMatch = selectedProvince === '' || researcher.province === selectedProvince;
        
        return fieldMatch && provinceMatch;
      })
      .sort((a, b) => {
        const sortValue = sortDirection === 'asc' ? 1 : -1;
        return sortValue * (a[sortBy] - b[sortBy]);
      });
  }, [topResearchersData, selectedField, selectedProvince, sortBy, sortDirection]);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredResearchers.length / ITEMS_PER_PAGE);
  const paginatedResearchers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredResearchers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredResearchers, currentPage]);

  // Handle page changes
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Handle field filter changes
  const handleFieldFilter = (field) => {
    setSelectedField(field);
    setCurrentPage(1); // Reset to first page on filter change
  };
  
  // Handle province filter changes
  const handleProvinceFilter = (province) => {
    setSelectedProvince(province);
    setCurrentPage(1); // Reset to first page on filter change
  };
  
  // Handle sorting change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      // Toggle sort direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc'); // Default to descending for new sort field
    }
    setCurrentPage(1); // Reset to first page on sort change
  };
  
  // Apply all filters together
  const applyFilters = () => {
    // This function would be used if we had backend filtering
    // Currently, filtering is handled through the useMemo above
  };

  // Component for displaying researcher impact profile
  const ResearcherImpactProfile = ({ researcher }) => {
    const radarData = [
      { name: 'H-Index', value: researcher.hIndex * 3.5 },  // Scaling for visualization
      { name: 'Sitasi', value: Math.min(researcher.citations / 100, 90) },  // Cap at 90
      { name: 'Publikasi', value: researcher.publications },
      { name: 'Kolaborasi', value: researcher.collaborations * 2.5 },  // Scaling for visualization
      { name: 'Internasional', value: researcher.internationalCollabs * 5 }  // Scaling for visualization
    ];
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="name" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar name="Profil Peneliti" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    );
  };

  // Generate researcher initials for the avatar
  const getResearcherInitials = (name) => {
    return name.split(' ')
      .filter(part => part.length > 0 && !['Dr.', 'Prof.'].includes(part))
      .map(n => n[0])
      .join('')
      .substring(0, 2);
  };

  // For demo purposes, automatically select first researcher
  React.useEffect(() => {
    if (!selectedResearcher && topResearchersData.length > 0) {
      setSelectedResearcher(topResearchersData[0]);
    }
  }, []);
  
  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-2 md:space-y-0">
        <h2 className="text-lg font-semibold">Peneliti Terkemuka di Indonesia</h2>
        <div className="flex flex-wrap gap-2">
          <select 
            className="border rounded px-2 py-1 text-sm"
            value={selectedField}
            onChange={(e) => handleFieldFilter(e.target.value)}
            aria-label="Filter berdasarkan bidang"
          >
            <option value="all">Semua Bidang</option>
            <option value="ti">Teknologi Informasi</option>
            <option value="med">Kedokteran</option>
            <option value="agr">Pertanian</option>
            <option value="eng">Teknik</option>
            <option value="soc">Sosial Ekonomi</option>
          </select>
          <select 
            className="border rounded px-2 py-1 text-sm"
            value={selectedProvince}
            onChange={(e) => handleProvinceFilter(e.target.value)}
            aria-label="Filter berdasarkan provinsi"
          >
            <option value="">Semua Provinsi</option>
            <option value="DKI Jakarta">DKI Jakarta</option>
            <option value="Jawa Barat">Jawa Barat</option>
            <option value="Jawa Timur">Jawa Timur</option>
            <option value="DI Yogyakarta">DI Yogyakarta</option>
            <option value="Jawa Tengah">Jawa Tengah</option>
          </select>
          <button 
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={applyFilters}
            aria-label="Terapkan filter"
          >
            Terapkan Filter
          </button>
        </div>
      </div>

      {/* Selected Researcher Details */}
      {selectedResearcher && (
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <h3 className="text-md font-semibold">{selectedResearcher.name}</h3>
            <button 
              className="text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => setSelectedResearcher(null)}
              aria-label="Tutup detail peneliti"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center mb-3">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <span className="text-2xl font-semibold text-blue-700">
                    {getResearcherInitials(selectedResearcher.name)}
                  </span>
                </div>
                <div>
                  <h4 className="text-md font-semibold">{selectedResearcher.name}</h4>
                  <p className="text-sm text-gray-700">{selectedResearcher.department}</p>
                  <p className="text-sm text-gray-700">{selectedResearcher.affiliation}, {selectedResearcher.location}</p>
                  <p className="text-sm text-blue-600 font-medium">Skor Dampak: {selectedResearcher.impactScore}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white rounded p-3 shadow-sm">
                  <p className="text-xs text-gray-500">H-Index</p>
                  <p className="text-xl font-bold">{selectedResearcher.hIndex}</p>
                </div>
                <div className="bg-white rounded p-3 shadow-sm">
                  <p className="text-xs text-gray-500">i10-Index</p>
                  <p className="text-xl font-bold">{selectedResearcher.i10Index}</p>
                </div>
                <div className="bg-white rounded p-3 shadow-sm">
                  <p className="text-xs text-gray-500">Publikasi</p>
                  <p className="text-xl font-bold">{selectedResearcher.publications}</p>
                </div>
                <div className="bg-white rounded p-3 shadow-sm">
                  <p className="text-xs text-gray-500">Sitasi</p>
                  <p className="text-xl font-bold">{selectedResearcher.citations.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">Publikasi Teratas:</h4>
                <ul className="space-y-2">
                  {selectedResearcher.topPublications.map((pub, index) => (
                    <li key={index} className="bg-white rounded p-2 text-sm hover:bg-gray-50 transition-colors">
                      <div className="font-medium">{pub.title}</div>
                      <div className="text-xs text-gray-600 mt-1 flex justify-between">
                        <span>{pub.journal} ({pub.year})</span>
                        <span className="flex items-center">
                          <svg className="w-3 h-3 text-blue-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
                          </svg>
                          {pub.citations}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-3">Profil Dampak:</h4>
              <ResearcherImpactProfile researcher={selectedResearcher} />
              
              <div className="mt-4 bg-white rounded p-3 shadow-sm">
                <h4 className="text-sm font-semibold mb-2">Jaringan Kolaborasi:</h4>
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-lg font-bold text-blue-700">{selectedResearcher.collaborations}</p>
                  </div>
                  <div className="h-12 border-l border-gray-200"></div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Domestik</p>
                    <p className="text-lg font-bold text-blue-700">{selectedResearcher.domesticCollabs}</p>
                  </div>
                  <div className="h-12 border-l border-gray-200"></div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Internasional</p>
                    <p className="text-lg font-bold text-blue-700">{selectedResearcher.internationalCollabs}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={100}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Domestik', value: selectedResearcher.domesticCollabs },
                          { name: 'Internasional', value: selectedResearcher.internationalCollabs }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {[
                          { name: 'Domestik', color: '#8884d8' },
                          { name: 'Internasional', color: '#82ca9d' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} kolaborasi`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="mt-4 bg-white rounded p-3 shadow-sm">
                <h4 className="text-sm font-semibold mb-2">Dana Penelitian:</h4>
                <p className="text-lg font-bold">{selectedResearcher.researchGrants} hibah</p>
                <p className="text-xs text-gray-500">dalam 5 tahun terakhir</p>
                
                <div className="mt-2 bg-blue-50 p-2 rounded">
                  <p className="text-xs text-blue-800">
                    <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Peneliti yang memiliki lebih banyak hibah cenderung memiliki skor dampak yang lebih tinggi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Researchers Table */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <h3 className="text-md font-semibold mb-4">Peneliti dengan Dampak Tertinggi</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Peneliti
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Afiliasi
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('hIndex')}
                >
                  <div className="flex items-center">
                    H-Index
                    {sortBy === 'hIndex' && (
                      <span className="ml-1">
                        {sortDirection === 'desc' ? '↓' : '↑'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('publications')}
                >
                  <div className="flex items-center">
                    Publikasi
                    {sortBy === 'publications' && (
                      <span className="ml-1">
                        {sortDirection === 'desc' ? '↓' : '↑'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('citations')}
                >
                  <div className="flex items-center">
                    Sitasi
                    {sortBy === 'citations' && (
                      <span className="ml-1">
                        {sortDirection === 'desc' ? '↓' : '↑'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kolaborasi
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('impactScore')}
                >
                  <div className="flex items-center">
                    Skor Dampak
                    {sortBy === 'impactScore' && (
                      <span className="ml-1">
                        {sortDirection === 'desc' ? '↓' : '↑'}
                      </span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedResearchers.map(researcher => (
                <tr 
                  key={researcher.id} 
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedResearcher?.id === researcher.id ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedResearcher(researcher)}
                >
                  <td className="px-4 py-2">
                    <div className="text-sm font-medium text-gray-900">{researcher.name}</div>
                    <div className="text-xs text-gray-500">{researcher.field}</div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-sm text-gray-900">{researcher.affiliation}</div>
                    <div className="text-xs text-gray-500">{researcher.location}</div>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {researcher.hIndex}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {researcher.publications}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {researcher.citations.toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                          {researcher.domesticCollabs} domestik
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                          {researcher.internationalCollabs} int'l
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${researcher.impactScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{researcher.impactScore}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, TOTAL_RESEARCHERS)} dari {TOTAL_RESEARCHERS.toLocaleString()} peneliti
          </div>
          <div className="flex space-x-2">
            <button 
              className={`border rounded px-3 py-1 text-sm ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Halaman sebelumnya"
            >
              Sebelumnya
            </button>
            {[...Array(Math.min(3, totalPages))].map((_, index) => {
              const pageNumber = currentPage + index - (currentPage > 1 ? 1 : 0);
              if (pageNumber > 0 && pageNumber <= totalPages) {
                return (
                  <button 
                    key={pageNumber}
                    className={`${pageNumber === currentPage ? 'bg-blue-600 text-white' : 'border text-gray-500 hover:bg-gray-50'} rounded px-3 py-1 text-sm`}
                    onClick={() => handlePageChange(pageNumber)}
                    aria-label={`Halaman ${pageNumber}`}
                    aria-current={pageNumber === currentPage ? 'page' : undefined}
                  >
                    {pageNumber}
                  </button>
                );
              }
              return null;
            })}
            <button 
              className={`border rounded px-3 py-1 text-sm ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Halaman berikutnya"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {/* Impact Score Explanation */}
      <div className="bg-blue-50 p-4 rounded-lg mt-6">
        <h3 className="text-md font-semibold mb-2">Tentang Skor Dampak Peneliti</h3>
        <p className="text-sm text-gray-700">
          Skor dampak peneliti di Wizdom Indonesia dihitung berdasarkan kombinasi dari metrik akademik tradisional, 
          dampak artikel yang dipublikasikan, dan jangkauan kolaborasi:
        </p>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded p-3 shadow-sm">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-medium">Metrik Akademik (50%)</h4>
            </div>
            <p className="text-xs mt-2 text-gray-600">
              H-index, i10-index, jumlah sitasi, dan produktivitas publikasi peneliti.
            </p>
          </div>
          <div className="bg-white rounded p-3 shadow-sm">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h4 className="font-medium">Dampak Artikel (30%)</h4>
            </div>
            <p className="text-xs mt-2 text-gray-600">
              Rata-rata dampak dari artikel yang dipublikasikan termasuk dampak akademik, sosial, dan praktis.
            </p>
          </div>
          <div className="bg-white rounded p-3 shadow-sm">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center mr-2">
                <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="font-medium">Jangkauan & Kolaborasi (20%)</h4>
            </div>
            <p className="text-xs mt-2 text-gray-600">
              Tingkat dan kualitas kolaborasi (lokal dan internasional), interdisiplinaritas, dan keterlibatan dengan masyarakat/industri.
            </p>
          </div>
        </div>
      </div>
      
      {/* Distribution by Field */}
      <div className="mt-6 mb-6 bg-white p-4 rounded-lg shadow">
        <h3 className="text-md font-semibold mb-4">Distribusi Peneliti berdasarkan Bidang</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={researcherDistributionByField}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="field" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [value, name === 'count' ? 'Jumlah Peneliti' : 'Dampak Rata-rata']}
              labelFormatter={(value) => `Bidang: ${value}`}
            />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" name="Jumlah Peneliti" />
            <Bar dataKey="avgImpact" fill="#82ca9d" name="Dampak Rata-rata" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
    </main>
  );
};

export default TopResearchers;