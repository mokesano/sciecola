import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const data = [
  { year: '2020', sdg3: 1000, sdg4: 500, sdg13: 1500, sdg9: 200, lain: 100 },
  { year: '2021', sdg3: 1100, sdg4: 600, sdg13: 1400, sdg9: 300, lain: 150 },
  { year: '2022', sdg3: 1200, sdg4: 850, sdg13: 1600, sdg9: 450, lain: 120 },
  { year: '2023', sdg3: 1550, sdg4: 1050, sdg13: 1600, sdg9: 550, lain: 100 },
  { year: '2024', sdg3: 1600, sdg4: 1250, sdg13: 2000, sdg9: 700, lain: 110 },
];

const SdgTrendChart = () => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      
      {/* Bagian Header Card */}
      <div className="flex justify-between items-end mb-6">
        <h3 className="text-lg md:text-xl font-bold text-gray-900">Tren Publikasi per SDGs</h3>
        <button className="text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors pb-0.5">
          Lihat semua
        </button>
      </div>

      {/* Bagian Canvas Grafik */}
      <div className="h-[300px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            
            {/* Garis bantu background: 
              horizontal={false} untuk mematikan garis mendatar, 
              vertical={true} untuk menyalakan garis tegak (dari sumbu X) 
            */}
            <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="#e5e7eb" />
            
            {/* Sumbu X (Tahun) */}
            <XAxis 
              dataKey="year" 
              axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }} 
              tickLine={false} 
              tick={{fill: '#6b7280', fontSize: 12, fontWeight: 500}} 
              dy={15} 
            />
            
            {/* Sumbu Y (Jumlah Artikel) */}
            <YAxis 
              axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }} 
              tickLine={false} 
              tick={{fill: '#6b7280', fontSize: 12, fontWeight: 500}} 
              dx={-15} 
            />
            
            {/* Tooltip interaktif saat dihover */}
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            
            {/* Legenda */}
            <Legend 
              iconType="circle" 
              wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} 
              verticalAlign="top"
              align="center"
            />

            {/* Garis-garis data untuk masing-masing kategori SDG */}
            <Line type="monotone" dataKey="sdg3" name="SDG 3" stroke="#4c9f38" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
            <Line type="monotone" dataKey="sdg4" name="SDG 4" stroke="#c5192d" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
            <Line type="monotone" dataKey="sdg13" name="SDG 13" stroke="#3f7e44" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
            <Line type="monotone" dataKey="sdg9" name="SDG 9" stroke="#fd6925" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
            <Line type="monotone" dataKey="lain" name="Lainnya" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
          
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SdgTrendChart;