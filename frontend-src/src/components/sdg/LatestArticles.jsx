import React from 'react';

// Data simulasi artikel untuk komponen (ditambahkan properti 'image' agar sesuai desain)
const articlesData = [
  {
    id: 1,
    title: 'Climate Change Adaptation in Coastal Communities',
    journal: 'Journal of Environmental Science',
    year: '2024',
    sdgs: [
      { id: 13, color: '#3f7e44' }, // Climate Action
      { id: 11, color: '#fd9d24' }, // Sustainable Cities
      { id: 14, color: '#0a97d9' }  // Life Below Water
    ],
    views: 652,
    citations: 24,
    image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 2,
    title: 'Sustainable Urban Transport Systems in Indonesia',
    journal: 'Sustainable Cities Review',
    year: '2024',
    sdgs: [
      { id: 11, color: '#fd9d24' },
      { id: 9, color: '#fd6925' }
    ],
    views: 510,
    citations: 18,
    image: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 3,
    title: 'Renewable Energy Policy and its Impact',
    journal: 'Energy Policy Journal',
    year: '2023',
    sdgs: [
      { id: 7, color: '#fcc30b' }, // Clean Energy
      { id: 13, color: '#3f7e44' }
    ],
    views: 411,
    citations: 32,
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=150&q=80',
  }
];

const LatestArticles = () => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full font-sans">
      
      {/* Header Komponen */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Artikel Terbaru</h3>
        <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
          Lihat semua
        </button>
      </div>

      {/* Daftar Artikel */}
      <div className="flex flex-col gap-4 flex-grow">
        {articlesData.map((article) => (
          <div 
            key={article.id} 
            className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors gap-4"
          >
            {/* Sisi Kiri: Thumbnail Gambar dan Info Teks */}
            <div className="flex items-start gap-4 flex-1">
              {/* Thumbnail Gambar (disesuaikan dengan desain asli) */}
              <div className="hidden sm:block w-16 h-14 rounded-lg overflow-hidden shrink-0 shadow-sm border border-gray-100">
                <img 
                  src={article.image} 
                  alt={article.title} 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Judul dan Jurnal */}
              <div>
                <a href="#" className="font-bold text-gray-800 hover:text-indigo-600 transition-colors line-clamp-2 leading-tight text-sm">
                  {article.title}
                </a>
                <div className="text-xs text-gray-500 mt-1.5">
                  {article.journal} • {article.year}
                </div>
              </div>
            </div>

            {/* Sisi Kanan: Metrik dan Label SDG */}
            <div className="flex items-center gap-6 sm:justify-end shrink-0">
              
              {/* Label SDGs */}
              <div className="flex gap-1.5">
                {article.sdgs.map((sdg, index) => (
                  <div 
                    key={index} 
                    className="w-6 h-6 rounded text-[10px] font-bold text-white flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: sdg.color }}
                    title={`SDG ${sdg.id}`}
                  >
                    {sdg.id}
                  </div>
                ))}
              </div>

              {/* Perbaikan: Mengganti tag <i> FontAwesome dengan <svg> ikon modern */}
              <div className="flex items-center gap-4 p-4 text-xs text-gray-500 font-medium">
                {/* Ikon Views (Mata) */}
                <div className="flex items-center gap-1.5" title="Total Views">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  {article.views}
                </div>
                
                {/* Ikon Sitasi (Kutipan) */}
                <div className="flex items-center gap-1.5" title="Total Citations">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                  </svg>
                  {article.citations}
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
};

export default LatestArticles;