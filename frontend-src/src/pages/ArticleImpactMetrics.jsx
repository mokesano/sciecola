import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const ArticleImpactMetrics = () => {
  // State
  const [selectedField, setSelectedField] = useState('all');
  const [timeRange, setTimeRange] = useState('all');
  const [sort, setSort] = useState('impact');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Data dummy untuk artikel dengan dampak tertinggi
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
      academicImpact: 82.5,
      socialImpact: 78.4,
      practicalImpact: 68.2,
      impactScore: 87.4
    },
    { 
      id: 2, 
      title: 'Pengembangan Material Nano-komposit dari Limbah Pertanian untuk Filtrasi Air', 
      authors: 'Purnama, A., Wijaya, H., Kusuma, T.', 
      journal: 'Jurnal Teknik Kimia Indonesia',
      year: 2024,
      citations: 15,
      social_mentions: 32,
      practical_uses: 18,
      sintaAccreditation: 'SINTA 1',
      academicImpact: 74.2,
      socialImpact: 71.5,
      practicalImpact: 85.8,
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
      academicImpact: 79.6,
      socialImpact: 76.2,
      practicalImpact: 81.4,
      impactScore: 82.9
    },
    { 
      id: 4, 
      title: 'Deteksi Dini Penyakit Tropis Menggunakan Algoritma Machine Learning', 
      authors: 'Kusuma, T., Wijaya, S., Putra, D.', 
      journal: 'Jurnal Kedokteran Indonesia',
      year: 2024,
      citations: 19,
      social_mentions: 36,
      practical_uses: 8,
      sintaAccreditation: 'SINTA 1',
      academicImpact: 77.8,
      socialImpact: 81.5,
      practicalImpact: 65.8,
      impactScore: 80.7
    },
    { 
      id: 5, 
      title: 'Efektivitas Pembelajaran Daring di Pendidikan Tinggi Pasca Pandemi', 
      authors: 'Hartono, L., Pratiwi, S.', 
      journal: 'Jurnal Pendidikan Indonesia',
      year: 2023,
      citations: 32,
      social_mentions: 42,
      practical_uses: 6,
      sintaAccreditation: 'SINTA 1',
      academicImpact: 86.4,
      socialImpact: 84.2,
      practicalImpact: 58.6,
      impactScore: 79.8
    }
  ];

  // Data untuk komponen dampak
  const impactComponents = [
    { name: 'Sitasi Akademik', akademik: 45, sosial: 30, praktis: 25 },
    { name: 'Media Sosial', akademik: 20, sosial: 60, praktis: 40 },
    { name: 'Implementasi Praktis', akademik: 15, sosial: 25, praktis: 65 },
    { name: 'Kebijakan Publik', akademik: 35, sosial: 40, praktis: 55 },
    { name: 'Kolaborasi', akademik: 55, sosial: 35, praktis: 30 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Fungsi untuk mengubah halaman
  const changePage = (page) => {
    setCurrentPage(page);
  };

  // Fungsi untuk mengganti urutan
  const changeSort = (sortField) => {
    setSort(sortField);
  };

  // Komponen untuk menampilkan grafik dampak artikel
  const ArticleImpactChart = ({ article }) => {
    const data = [
      { name: 'Akademik', value: article.academicImpact },
      { name: 'Sosial', value: article.socialImpact },
      { name: 'Praktis', value: article.practicalImpact }
    ];

    return (
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="name" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar name="Dampak" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* Header dan Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-2 md:space-y-0">
        <h2 className="text-lg font-semibold">Analisis Dampak Artikel</h2>
        <div className="flex flex-wrap gap-2">
          <select 
            className="border rounded px-2 py-1 text-sm"
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
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
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="all">Semua Waktu</option>
            <option value="year">1 Tahun Terakhir</option>
            <option value="3years">3 Tahun Terakhir</option>
            <option value="5years">5 Tahun Terakhir</option>
          </select>
          <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
            Terapkan Filter
          </button>
        </div>
      </div>

      {/* Penjelasan Skor Dampak */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-md font-semibold mb-2">Tentang Skor Dampak Artikel</h3>
        <p className="text-sm text-gray-700">
          Skor dampak di Wizdom Indonesia menggabungkan tiga dimensi utama pengukuran dampak penelitian:
        </p>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded p-3 shadow-sm">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h4 className="font-medium">Dampak Akademik (45%)</h4>
            </div>
            <p className="text-xs mt-2 text-gray-600">
              Mengukur sitasi, indeks h artikel, kualitas jurnal, dan faktor dampak akademis lainnya.
            </p>
          </div>
          <div className="bg-white rounded p-3 shadow-sm">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="font-medium">Dampak Media Sosial (25%)</h4>
            </div>
            <p className="text-xs mt-2 text-gray-600">
              Mengukur penyebaran dan diskusi penelitian di platform sosial, media berita, dan blog.
            </p>
          </div>
          <div className="bg-white rounded p-3 shadow-sm">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center mr-2">
                <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-medium">Dampak Penggunaan (30%)</h4>
            </div>
            <p className="text-xs mt-2 text-gray-600">
              Mengukur implementasi praktis, pengaruh pada kebijakan, produk, dan manfaat langsung pada masyarakat.
            </p>
          </div>
        </div>
      </div>

      {/* Tabel Artikel */}
      <div className="mt-6">
        <h3 className="text-md font-semibold mb-4">Artikel dengan Dampak Tertinggi</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul & Penulis</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jurnal</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tahun</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akademik</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sosial</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Praktis</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skor Dampak</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topArticlesData.map(article => (
                <tr 
                  key={article.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedArticle(article)}
                >
                  <td className="px-4 py-2">
                    <div className="text-sm font-medium text-gray-900">{article.title}</div>
                    <div className="text-xs text-gray-500">{article.authors}</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{article.journal}</div>
                    <div className="text-xs text-gray-500">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        article.sintaAccreditation === 'SINTA 1' ? 'bg-green-100 text-green-800' :
                        article.sintaAccreditation === 'SINTA 2' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {article.sintaAccreditation}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {article.year}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-blue-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
                      </svg>
                      {article.citations}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
                      </svg>
                      {article.social_mentions}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"></path>
                      </svg>
                      {article.practical_uses}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${article.impactScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{article.impactScore}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Menampilkan 1-5 dari 1,245 artikel
          </div>
          <div className="flex space-x-2">
            <button className="border rounded px-3 py-1 text-sm text-gray-500">Sebelumnya</button>
            <button className="bg-blue-600 text-white rounded px-3 py-1 text-sm">1</button>
            <button className="border rounded px-3 py-1 text-sm text-gray-500">2</button>
            <button className="border rounded px-3 py-1 text-sm text-gray-500">3</button>
            <button className="border rounded px-3 py-1 text-sm text-gray-500">Berikutnya</button>
          </div>
        </div>
      </div>

      {/* Detail Artikel yang Dipilih */}
      {selectedArticle && (
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <h3 className="text-md font-semibold">Detail Artikel: {selectedArticle.title}</h3>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedArticle(null)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                <b>Penulis:</b> {selectedArticle.authors}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <b>Jurnal:</b> {selectedArticle.journal} ({selectedArticle.year}) - {selectedArticle.sintaAccreditation}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <b>Skor Dampak Total:</b> <span className="font-semibold">{selectedArticle.impactScore}</span>
              </p>
              
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">Komponen Dampak:</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Dampak Akademik</span>
                      <span>{selectedArticle.academicImpact}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full" 
                        style={{ width: `${selectedArticle.academicImpact}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Dampak Media Sosial</span>
                      <span>{selectedArticle.socialImpact}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-green-600 h-1.5 rounded-full" 
                        style={{ width: `${selectedArticle.socialImpact}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Dampak Penggunaan Praktis</span>
                      <span>{selectedArticle.practicalImpact}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-yellow-600 h-1.5 rounded-full" 
                        style={{ width: `${selectedArticle.practicalImpact}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-3">Profil Dampak:</h4>
              <ArticleImpactChart article={selectedArticle} />
            </div>
          </div>
        </div>
      )}

      {/* Komponen Dampak */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-md font-semibold mb-4">Analisis Komponen Dampak</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart outerRadius={90} data={impactComponents}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar name="Dampak Akademik" dataKey="akademik" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Radar name="Dampak Media Sosial" dataKey="sosial" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
              <Radar name="Dampak Penggunaan Praktis" dataKey="praktis" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-md font-semibold mb-4">Dampak Berdasarkan Akreditasi SINTA</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                { name: 'SINTA 1', akademik: 45, sosial: 35, praktis: 28 },
                { name: 'SINTA 2', akademik: 38, sosial: 32, praktis: 24 },
                { name: 'SINTA 3', akademik: 30, sosial: 28, praktis: 18 },
                { name: 'SINTA 4', akademik: 22, sosial: 25, praktis: 14 },
                { name: 'SINTA 5', akademik: 15, sosial: 20, praktis: 10 },
                { name: 'SINTA 6', akademik: 10, sosial: 15, praktis: 8 }
              ]}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" />
              <Tooltip />
              <Legend />
              <Bar dataKey="akademik" stackId="a" fill="#8884d8" name="Dampak Akademik" />
              <Bar dataKey="sosial" stackId="a" fill="#82ca9d" name="Dampak Media Sosial" />
              <Bar dataKey="praktis" stackId="a" fill="#ffc658" name="Dampak Penggunaan Praktis" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ArticleImpactMetrics;