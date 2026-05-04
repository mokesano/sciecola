import React from 'react';
// Mengimpor elemen-elemen pembuat grafik garis dari recharts
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// Data simulasi berdasarkan mockup Anda (Tahun 2020-2024)
// Data ini merepresentasikan jumlah artikel per tahun
const data = [
  { year: '2020', sdg3: 1000, sdg4: 500, sdg13: 1500, sdg9: 200, lain: 100 },
  { year: '2021', sdg3: 1100, sdg4: 600, sdg13: 1400, sdg9: 300, lain: 150 },
  { year: '2022', sdg3: 1200, sdg4: 850, sdg13: 1600, sdg9: 450, lain: 120 },
  { year: '2023', sdg3: 1550, sdg4: 1050, sdg13: 1600, sdg9: 550, lain: 100 },
  { year: '2024', sdg3: 1600, sdg4: 1250, sdg13: 2000, sdg9: 700, lain: 110 },
];

const SdgTrendChart = () => {
  return (
    // Pembungkus utama dengan gaya card putih berbayang halus
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      
      {/* Bagian Header Card */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Tren Publikasi per SDGs</h3>
        <button className="text-sm text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
          Lihat semua
        </button>
      </div>

      {/* Bagian Canvas Grafik */}
      <div className="h-[300px] w-full">
        {/* ResponsiveContainer membuat grafik SVG selalu pas dengan lebar card */}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            
            {/* Garis bantu background (hanya garis horizontal agar bersih seperti desain) */}
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            
            {/* Sumbu X (Tahun) - tanpa garis pinggir agar lebih modern */}
            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
            
            {/* Sumbu Y (Jumlah Artikel) - tanpa garis pinggir */}
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dx={-10} />
            
            {/* Tooltip interaktif saat dihover */}
            <Tooltip 
              contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            
            {/* Legenda (SDG 3, SDG 4, dst) di bagian atas */}
            <Legend 
              iconType="circle" 
              wrapperStyle={{ fontSize: '13px', paddingBottom: '20px' }} 
              verticalAlign="top"
            />

            {/* Garis-garis data untuk masing-masing kategori SDG */}
            {/* Parameter strokeWidth={3} mengatur ketebalan garis */}
            <Line type="monotone" dataKey="sdg3" name="SDG 3" stroke="#4c9f38" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
            <Line type="monotone" dataKey="sdg4" name="SDG 4" stroke="#c5192d" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
            <Line type="monotone" dataKey="sdg13" name="SDG 13" stroke="#3f7e44" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
            <Line type="monotone" dataKey="sdg9" name="SDG 9" stroke="#fd6925" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
            <Line type="monotone" dataKey="lain" name="Lainnya" stroke="#818cf8" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
          
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SdgTrendChart;