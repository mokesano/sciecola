import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Leaderboard = () => {
  const [activeCategory, setActiveCategory] = useState('peneliti');
  const [activeRankType, setActiveRankType] = useState('global');

  // Mock Data
  const stats = {
    peneliti: { value: '10,892', growth: '+12%' },
    publikasi: { value: '98,732', growth: '+18%' },
    sitasi: { value: '21,897', growth: '+22%' }
  };

  const researchers = [
    { rank: 1, name: 'Dr. Andi Rahman', institution: 'Universitas Indonesia', country: 'Indonesia', publikasi: 42, sitasi: 1248, hIndex: 17, impact: 92.4, avatar: 'https://i.pravatar.cc/150?img=11' },
    { rank: 2, name: 'Dr. Siti Nurhaliza', institution: 'BRIN', country: 'Indonesia', publikasi: 38, sitasi: 1102, hIndex: 15, impact: 88.7, avatar: 'https://i.pravatar.cc/150?img=5' },
    { rank: 3, name: 'Prof. Budi Santoso', institution: 'Institut Teknologi Bandung', country: 'Indonesia', publikasi: 35, sitasi: 982, hIndex: 14, impact: 85.1, avatar: 'https://i.pravatar.cc/150?img=12' },
    { rank: 4, name: 'Dr. Dewi Setiawan', institution: 'Universitas Airlangga', country: 'Indonesia', publikasi: 31, sitasi: 876, hIndex: 13, impact: 78.6, avatar: 'https://i.pravatar.cc/150?img=9' },
    { rank: 5, name: 'Prof. Rizky Pratama', institution: 'IPB University', country: 'Indonesia', publikasi: 28, sitasi: 764, hIndex: 12, impact: 72.3, avatar: 'https://i.pravatar.cc/150?img=3' },
    { rank: 6, name: 'Dr. Fatimah Azzahra', institution: 'Universitas Hasanuddin', country: 'Indonesia', publikasi: 26, sitasi: 688, hIndex: 12, impact: 69.8, avatar: 'https://i.pravatar.cc/150?img=10' },
    { rank: 7, name: 'Dr. Bambang Supriyadi', institution: 'BRIN', country: 'Indonesia', publikasi: 24, sitasi: 654, hIndex: 11, impact: 66.2, avatar: 'https://i.pravatar.cc/150?img=60' },
    { rank: 8, name: 'Dr. Maria Fernandez', institution: 'Universitas Gadjah Mada', country: 'Indonesia', publikasi: 23, sitasi: 612, hIndex: 11, impact: 63.4, avatar: 'https://i.pravatar.cc/150?img=44' },
    { rank: 9, name: 'Dr. Dwi Setiawan', institution: 'Universitas Andalas', country: 'Indonesia', publikasi: 22, sitasi: 598, hIndex: 10, impact: 61.7, avatar: 'https://i.pravatar.cc/150?img=33' },
    { rank: 10, name: 'Prof. Rina Wulandari', institution: 'Universitas Diponegoro', country: 'Indonesia', publikasi: 21, sitasi: 560, hIndex: 10, impact: 59.3, avatar: 'https://i.pravatar.cc/150?img=28' }
  ];

  const impactFactors = [
    { label: 'Kuantitas Publikasi', weight: 30, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Kualitas Sitasi', weight: 30, icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
    { label: 'h-Index', weight: 20, icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { label: 'Dampak SDGs', weight: 20, icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
  ];

  const fields = [
    { name: 'Environmental Science', count: 1245, color: 'bg-emerald-100 text-emerald-700' },
    { name: 'Social Sciences', count: 982, color: 'bg-blue-100 text-blue-700' },
    { name: 'Engineering', count: 1023, color: 'bg-amber-100 text-amber-700' },
    { name: 'Health Sciences', count: 876, color: 'bg-red-100 text-red-700' },
    { name: 'Lainnya', count: 6766, color: 'bg-purple-100 text-purple-700' }
  ];

  const achievements = [
    { name: 'Dr. Siti Nurhaliza', institution: 'BRIN', growth: 156, avatar: 'https://i.pravatar.cc/150?img=5' },
    { name: 'Dr. Dewi Setiawan', institution: 'Universitas Airlangga', growth: 132, avatar: 'https://i.pravatar.cc/150?img=9' },
    { name: 'Dr. Rizky Pratama', institution: 'IPB University', growth: 128, avatar: 'https://i.pravatar.cc/150?img=3' }
  ];

  const categories = ['Peneliti', 'Institusi', 'Jurnal'];
  const rankTypes = ['Peringkat Global', 'Peringkat Nasional'];

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">Leaderboard</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</h1>
          <p className="text-gray-600 max-w-xl">
            Mengapresiasi peneliti, institusi, dan jurnal yang memberikan kontribusi terbesar terhadap pencapaian SDGs melalui riset berkualitas dan berdampak.
          </p>
        </div>
        <div className="hidden lg:block">
          <img src="https://via.placeholder.com/300x180/f3f4f6/9ca3af?text=Trophy+Illustration" alt="Leaderboard Trophy" className="h-32 object-contain" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat.toLowerCase())}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat.toLowerCase()
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
        <select className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option>Semua Negara</option>
          <option>Indonesia</option>
          <option>Malaysia</option>
          <option>Singapore</option>
        </select>
        <select className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option>Tahun 2024</option>
          <option>Tahun 2023</option>
          <option>Tahun 2022</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Peneliti', value: stats.peneliti.value, growth: stats.peneliti.growth, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
          { label: 'Total Publikasi', value: stats.publikasi.value, growth: stats.publikasi.growth, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { label: 'Total Sitasi', value: stats.sitasi.value, growth: stats.sitasi.growth, icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-xs font-medium text-green-600">{stat.growth} dari tahun lalu</p>
            </div>
          </div>
        ))}
      </div>

      {/* Rank Type Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        {rankTypes.map((type) => (
          <button
            key={type}
            onClick={() => setActiveRankType(type === 'Peringkat Global' ? 'global' : 'nasional')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeRankType === (type === 'Peringkat Global' ? 'global' : 'nasional')
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Peringkat</th>
                <th className="px-6 py-4 font-medium">Peneliti</th>
                <th className="px-6 py-4 font-medium text-right">Publikasi</th>
                <th className="px-6 py-4 font-medium text-right">Sitasi</th>
                <th className="px-6 py-4 font-medium text-right">h-index</th>
                <th className="px-6 py-4 font-medium text-right">Skor Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {researchers.map((r) => (
                <tr key={r.rank} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm bg-gray-100 text-gray-700">
                      {r.rank <= 3 ? (
                        <span className={r.rank === 1 ? 'text-yellow-600 bg-yellow-100' : r.rank === 2 ? 'text-gray-600 bg-gray-200' : 'text-amber-700 bg-amber-100'}>
                          {r.rank}
                        </span>
                      ) : r.rank}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={r.avatar} alt={r.name} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-gray-900">{r.name}</p>
                        <p className="text-sm text-gray-500">{r.institution}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">{r.publikasi}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">{r.sitasi.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">{r.hIndex}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <span className="font-bold text-indigo-600 w-10 text-right">{r.impact}</span>
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${r.impact}%` }}></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 text-center">
          <button className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
            Muat Lebih Banyak
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Calculation Method */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Cara Perhitungan Skor Impact</h3>
          <p className="text-sm text-gray-600 mb-4">Skor Impact dihitung berdasarkan kombinasi beberapa indikator penting dalam kontribusi riset terhadap SDGs.</p>
          <div className="space-y-3">
            {impactFactors.map((factor, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-indigo-50 rounded flex items-center justify-center text-indigo-600">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={factor.icon} />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">{factor.label}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{factor.weight}%</span>
              </div>
            ))}
          </div>
          <Link to="/methodology" className="mt-4 inline-block text-sm text-indigo-600 hover:underline font-medium">
            Pelajari lebih lanjut tentang metode perhitungan →
          </Link>
        </div>

        {/* Fields Ranking */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Peringkat Berdasarkan Bidang Keahlian</h3>
          <p className="text-sm text-gray-600 mb-4">Lihat leaderboard peneliti berdasarkan bidang keahlian utama mereka.</p>
          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${field.color}`}>
                    {idx + 1}
                  </span>
                  <span className="text-sm text-gray-700">{field.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{field.count.toLocaleString()} Peneliti</span>
              </div>
            ))}
          </div>
          <Link to="/fields" className="mt-4 inline-block text-sm text-indigo-600 hover:underline font-medium">
            Lihat semua bidang →
          </Link>
        </div>

        {/* Yearly Achievements */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Pencapaian Tahun Ini
          </h3>
          <p className="text-sm text-gray-600 mb-4">Apresiasi khusus bagi peneliti dengan peningkatan kontribusi tertinggi di tahun 2024.</p>
          <div className="space-y-3">
            {achievements.map((ach, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <img src={ach.avatar} alt={ach.name} className="w-8 h-8 rounded-full object-cover" />
                <div className="flex-grow">
                  <p className="text-sm font-semibold text-gray-900">{ach.name}</p>
                  <p className="text-xs text-gray-500">{ach.institution}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">▲ {ach.growth}%</p>
                  <p className="text-[10px] text-gray-500">Peningkatan Skor</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/achievements" className="mt-4 inline-block text-sm text-indigo-600 hover:underline font-medium">
            Lihat semua pencapaian →
          </Link>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg flex flex-col lg:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-bold mb-2">Tingkatkan Peringkat Anda</h3>
          <p className="text-indigo-100">Terus hasilkan riset berkualitas dan berkontribusi pada pencapaian SDGs global.</p>
        </div>
        <Link to="/analyze" className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap flex items-center gap-2">
          Mulai Berkontribusi
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </main>
  );
};

export default Leaderboard;