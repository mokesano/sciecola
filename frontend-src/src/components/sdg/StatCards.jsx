import React from 'react';

// Data statis Sicola dengan ukuran ikon yang lebih besar dan garis lebih tebal
const statsData = [
  { 
    label: 'Artikel Terklasifikasi', 
    value: '24,751', 
    icon: (
      // Ukuran menjadi w-8 h-8, ketebalan garis menjadi 2.5
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ), 
    colorClass: 'text-indigo-600', 
    bgClass: 'bg-indigo-50' 
  },
  { 
    label: 'Peneliti', 
    value: '12,843', 
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ), 
    colorClass: 'text-blue-600', 
    bgClass: 'bg-blue-50' 
  },
  { 
    label: 'Jurnal', 
    value: '1,259', 
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
      </svg>
    ), 
    colorClass: 'text-indigo-800', 
    bgClass: 'bg-indigo-100' 
  },
  { 
    label: 'SDGs Terwakili', 
    value: '21,897', 
    icon: (
      // Ukuran SVG Roda Warna disesuaikan menjadi w-10 h-10 agar proporsional
      <svg className="w-10 h-10" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        <path fill="#E5243B" d="M18 2 A 16 16 0 0 1 34 18 L 26 18 A 8 8 0 0 0 18 10 Z"/>
        <path fill="#DDA63A" d="M34 18 A 16 16 0 0 1 18 34 L 18 26 A 8 8 0 0 0 26 18 Z"/>
        <path fill="#4C9F38" d="M18 34 A 16 16 0 0 1 2 18 L 10 18 A 8 8 0 0 0 18 26 Z"/>
        <path fill="#00689D" d="M2 18 A 16 16 0 0 1 18 2 L 18 10 A 8 8 0 0 0 10 18 Z"/>
      </svg>
    ), 
    colorClass: '', 
    bgClass: 'bg-transparent' 
  },
  { 
    label: 'Total Sitasi', 
    value: '98,732', 
    icon: (
      // Ukuran disesuaikan menjadi w-8 h-8
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
      </svg>
    ), 
    colorClass: 'text-orange-500', 
    bgClass: 'bg-orange-50' 
  }
];

const StatCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {statsData.map((stat, index) => (
        <div 
          key={index} 
          className="bg-white p-4 lg:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md"
        >
          {/* Lingkaran pembungkus diperbesar menjadi min-w-[56px] dan h-[56px] */}
          <div className={`min-w-[56px] h-[56px] rounded-full flex shrink-0 items-center justify-center ${stat.bgClass} ${stat.colorClass}`}>
            {stat.icon}
          </div>
          
          <div>
            <div className="text-xl font-bold text-gray-800">{stat.value}</div>
            <div className="text-xs text-gray-500 font-medium mt-0.5">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatCards;