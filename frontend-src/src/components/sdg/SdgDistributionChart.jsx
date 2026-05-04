import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const SdgDistributionChart = () => {
  const data = [
    { id: '3', name: 'Good Health & Well-being', value: 4623, percent: '18.7%', color: '#4C9F38' },
    { id: '4', name: 'Quality Education', value: 3812, percent: '15.4%', color: '#C5192D' },
    { id: '13', name: 'Climate Action', value: 3263, percent: '13.2%', color: '#3F7E44' },
    { id: '9', name: 'Industry, Innovation & Infrastructure', value: 2865, percent: '11.6%', color: '#FD6925' },
    { id: '11', name: 'Sustainable Cities & Communities', value: 2421, percent: '9.8%', color: '#FD9D24' },
    { id: '', name: 'Lainnya', value: 7767, percent: '31.3%', color: '#8B5CF6' }, 
  ];

  const totalArticles = "24,751";

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.1)] border border-gray-100">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <h3 className="text-lg md:text-xl font-bold text-gray-900">Distribusi Klasifikasi SDGs</h3>
        <a href="#" className="text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors pb-0.5">
          Lihat semua
        </a>
      </div>
      
      {/* Container untuk Chart (Kiri) dan Legend (Kanan) */}
      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10">
        
        {/* Sisi Kiri: Donut Chart - Diberi ukuran tetap dan shrink-0 agar tidak menyusut */}
        <div className="relative w-full md:w-[260px] shrink-0 h-[260px] flex justify-center items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={75}
                outerRadius={120}
                paddingAngle={0} 
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value} Artikel`, 'Total']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Teks di tengah Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-extrabold text-gray-900">{totalArticles}</span>
            <span className="text-sm font-medium text-gray-500 mt-1">Artikel</span>
          </div>
        </div>

        {/* Sisi Kanan: Custom Legend - flex-1 agar mengisi sisa ruang secara dinamis */}
        <div className="w-full flex-1 flex flex-col gap-4">
          {data.map((item, index) => (
            // items-start memastikan elemen rata atas jika teks menjadi 2 baris
            <div key={index} className="flex items-start justify-between gap-3">
              
              <div className="flex items-start gap-3">
                {/* Kotak Warna - shrink-0 agar kotak tidak ikut gepeng */}
                <div 
                  className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5"
                  style={{ backgroundColor: item.color }}
                >
                  {item.id}
                </div>
                {/* Teks Nama SDG - Menghapus truncate agar bisa word wrap */}
                <span className="text-[13px] font-medium text-gray-800 leading-snug">
                  {item.name}
                </span>
              </div>

              {/* Teks Persentase - shrink-0 agar selalu utuh di ujung kanan */}
              <span className="text-[13px] font-semibold text-gray-600 shrink-0 mt-0.5">
                {item.percent}
              </span>
              
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default SdgDistributionChart;