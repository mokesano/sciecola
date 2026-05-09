import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const JournalList = () => {
  // Simulasi data jurnal
  const [journals] = useState([
    {
      id: "jess-2024",
      name: "Journal of Environmental Science and Sustainability",
      issn: "1234-5678",
      publisher: "Sangia Research Media",
      quartile: "Q1",
      sjr: "1.24",
      hIndex: "45",
      sdgFocus: [13, 11, 15]
    },
    {
      id: "the-lancet-sdg",
      name: "The Lancet Planetary Health",
      issn: "2542-5196",
      publisher: "Elsevier",
      quartile: "Q1",
      sjr: "4.82",
      hIndex: "92",
      sdgFocus: [3, 13]
    }
  ]);

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-12">
        <Link to="/" className="hover:text-indigo-600">Beranda</Link>
        <span>›</span>
        <span className="text-gray-900">Database Jurnal</span>
      </div>

      {/* Header Halaman */}
      <div className="mb-10">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Database Jurnal</h1>
        <p className="text-lg font-semibold text-gray-600 mt-1 max-w-2xl">Temukan jurnal bereputasi berdasarkan kesesuaian target SDGs.</p>
      </div>

      {/* Filter Bar Sederhana (Mengikuti desain ResearchExplorer Anda) */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-8 flex flex-wrap gap-4 items-center">
        <div className="flex-grow relative">
          <input 
            type="text" 
            placeholder="Cari nama jurnal atau ISSN..." 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
        <select className="bg-gray-50 border-none rounded-xl py-2.5 px-4 text-sm font-medium text-gray-600 outline-none">
          <option>Semua Quartile</option>
          <option>Q1 - Top Tier</option>
          <option>Q2 - High Tier</option>
        </select>
      </div>

      {/* Grid Daftar Jurnal */}
      <div className="grid grid-cols-1 gap-6">
        {journals.map((journal) => (
          <Link 
            key={journal.id} 
            to={`/journals/${journal.id}`}
            className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
          >
            <div className="flex gap-5 items-start">
              {/* Ikon/Logo Jurnal Dummy */}
              <div className="w-16 h-20 bg-indigo-50 rounded-lg flex flex-col items-center justify-center text-indigo-400 border border-indigo-100 shrink-0">
                <span className="text-[10px] font-bold">JOURNAL</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 text-lg transition-colors leading-tight mb-1">
                  {journal.name}
                </h3>
                <p className="text-gray-500 text-sm mb-3">ISSN: {journal.issn} • {journal.publisher}</p>
                <div className="flex gap-2">
                  {journal.sdgFocus.map(sdg => (
                    <span key={sdg} className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-[10px] font-bold border border-gray-100">
                      SDG {sdg}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Metrik Jurnal (Samping Kanan) */}
            <div className="flex items-center gap-8 w-full md:w-auto pt-4 md:pt-0 border-t md:border-0 border-gray-50">
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Quartile</p>
                <span className="text-lg font-black text-emerald-600">{journal.quartile}</span>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">SJR</p>
                <span className="text-lg font-black text-gray-900">{journal.sjr}</span>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">H-Index</p>
                <span className="text-lg font-black text-gray-900">{journal.hIndex}</span>
              </div>
              <div className="ml-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
};

export default JournalList;