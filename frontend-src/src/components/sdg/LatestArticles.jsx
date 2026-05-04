import React from 'react';

// Data simulasi artikel untuk Sicola
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
  }
];

const LatestArticles = () => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
      
      {/* Header Komponen */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Artikel Terbaru</h3>
        <button className="text-sm text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
          Lihat semua
        </button>
      </div>

      {/* Daftar Artikel */}
      <div className="flex flex-col gap-4 flex-grow">
        {articlesData.map((article) => (
          <div 
            key={article.id} 
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors gap-4"
          >
            {/* Sisi Kiri: Ikon dan Info Teks */}
            <div className="flex items-start gap-4 flex-1">
              {/* Ikon Thumbnail */}
              <div className="hidden sm:flex w-12 h-12 rounded-lg bg-indigo-100 items-center justify-center text-indigo-500 shrink-0">
                <i className="fas fa-file-alt text-lg"></i>
              </div>
              
              {/* Judul dan Jurnal */}
              <div>
                <a href="#" className="font-bold text-gray-800 hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
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
                    className="w-7 h-7 rounded text-[10px] font-bold text-white flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: sdg.color }}
                    title={`SDG ${sdg.id}`}
                  >
                    {sdg.id}
                  </div>
                ))}
              </div>

              {/* Metrik Views dan Sitasi */}
              <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                <div className="flex items-center gap-1.5" title="Total Views">
                  <i className="fas fa-eye text-gray-400"></i> {article.views}
                </div>
                <div className="flex items-center gap-1.5" title="Total Citations">
                  <i className="fas fa-quote-right text-gray-400"></i> {article.citations}
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