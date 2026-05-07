import React from 'react';
import { Link } from 'react-router-dom';

const ResearchersList = () => {
  // Data dummy peneliti (Nantinya diambil dari database PHP)
  const researchers = [
    { id: 1, name: "Dr. Andi Rahman", orcid: "0000-0002-1825-0097", univ: "Universitas Indonesia", count: 42 },
    { id: 2, name: "Prof. Budi Santoso", orcid: "0000-0001-5543-2210", univ: "Universitas Gadjah Mada", count: 18 },
    { id: 3, name: "Dr. Siti Nurhaliza", orcid: "0000-0003-9981-4456", univ: "Institut Teknologi Bandung", count: 14 },
  ];

  return (
    <div className="pt-28 pb-12 px-6 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Daftar Peneliti</h1>
        <p className="text-gray-500 mt-2">Daftar peneliti yang telah dianalisis berdasarkan data ORCID.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {researchers.map((pro) => (
          <Link 
            key={pro.id} 
            to={`/orcid/${pro.orcid}`}
            className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-500 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 text-2xl font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                {pro.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-indigo-600">{pro.name}</h3>
                <p className="text-sm text-gray-500">{pro.univ}</p>
                <div className="mt-2 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block">
                  {pro.count} Artikel Teranalisis
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ResearchersList;