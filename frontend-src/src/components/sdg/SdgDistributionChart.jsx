import React from 'react';
// 1. Impor komponen yang dibutuhkan dari Recharts
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// 2. Data statis (Nantinya data ini akan diisi dari API PHP Anda)
const data = [
  { name: 'Good Health & Well-being', value: 4623, color: '#4c9f38' }, // SDG 3
  { name: 'Quality Education', value: 3812, color: '#c5192d' },        // SDG 4
  { name: 'Climate Action', value: 3263, color: '#3f7e44' },           // SDG 13
  { name: 'Industry & Innovation', value: 2865, color: '#fd6925' },    // SDG 9
  { name: 'Lainnya', value: 10188, color: '#818cf8' },                 // Lainnya
];

const SdgDistributionChart = () => {
  return (
    // Membungkus grafik dalam div dengan gaya Tailwind CSS
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Distribusi Klasifikasi SDGs</h3>
        <button className="text-sm text-indigo-500 hover:text-indigo-700 font-medium">Lihat semua</button>
      </div>
      
      {/* 
        ResponsiveContainer memastikan grafik SVG menyesuaikan 
        lebar elemen induknya secara otomatis 
      */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* Konfigurasi Pie untuk membentuk Doughnut (innerRadius > 0) */}
            <Pie
              data={data}
              cx="50%" // Posisi tengah X
              cy="50%" // Posisi tengah Y
              innerRadius={80} // Membuat lubang di tengah (Doughnut)
              outerRadius={110} // Ketebalan lingkaran
              paddingAngle={2} // Jarak antar potongan
              dataKey="value"
              stroke="none" // Menghilangkan garis batas
            >
              {/* Memberikan warna spesifik untuk setiap potongan SDG */}
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            
            {/* Tooltip interaktif saat mouse diarahkan ke grafik */}
            <Tooltip 
              formatter={(value) => [`${value} Artikel`, 'Total']}
              contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            
            {/* Legenda penanda warna di sebelah kanan */}
            <Legend 
              layout="vertical" 
              verticalAlign="middle" 
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: '14px', color: '#4b5563' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SdgDistributionChart;