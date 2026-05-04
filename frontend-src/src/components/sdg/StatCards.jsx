import React from 'react';

// Data statis sementara (nantinya nilai ini akan diambil dari API PHP)
const statsData = [
  { 
    label: 'Artikel Terklasifikasi', 
    value: '24,751', 
    icon: 'fas fa-file-alt', 
    colorClass: 'text-indigo-500', 
    bgClass: 'bg-indigo-50' 
  },
  { 
    label: 'Peneliti', 
    value: '12,843', 
    icon: 'fas fa-users', 
    colorClass: 'text-blue-500', 
    bgClass: 'bg-blue-50' 
  },
  { 
    label: 'Jurnal', 
    value: '1,259', 
    icon: 'fas fa-book', 
    colorClass: 'text-purple-500', 
    bgClass: 'bg-purple-50' 
  },
  { 
    label: 'Total Sitasi', 
    value: '98,732', 
    icon: 'fas fa-quote-right', 
    colorClass: 'text-orange-500', 
    bgClass: 'bg-orange-50' 
  }
];

const StatCards = () => {
  return (
    // Menggunakan CSS Grid agar responsif: 1 kolom di HP, 2 di tablet, 4 di desktop
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      
      {/* Melakukan perulangan (mapping) untuk merender setiap kotak statistik */}
      {statsData.map((stat, index) => (
        <div 
          key={index} 
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md"
        >
          {/* Ikon dengan warna latar yang dinamis */}
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${stat.bgClass} ${stat.colorClass}`}>
            <i className={stat.icon}></i>
          </div>
          
          {/* Teks Angka dan Label */}
          <div>
            <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
            <div className="text-sm text-gray-500 font-medium mt-1">{stat.label}</div>
          </div>
        </div>
      ))}

    </div>
  );
};

export default StatCards;