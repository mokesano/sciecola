import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HeroSearch = () => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const query = inputValue.trim();
    
    if (query !== '') {
      setIsLoading(true);
      setStatusMsg('Mendeteksi format...');

      // Jeda singkat agar UI tidak terasa terlalu "kaku" saat regex bekerja
      setTimeout(() => {
        // Regex untuk mendeteksi ORCID (Format: XXXX-XXXX-XXXX-XXXX atau ujungnya X)
        const isOrcid = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(query);
        
        // Regex untuk mendeteksi DOI (Format: 10.XXXX/...)
        const isDoi = /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i.test(query);

        setIsLoading(false);

        if (isOrcid) {
          setStatusMsg('Mengalihkan ke profil peneliti...');
          navigate(`/orcid/${query}`);
        } else if (isDoi) {
          setStatusMsg('Mengalihkan ke profil artikel...');
          navigate(`/doi/${encodeURIComponent(query)}`);
        } else {
          setStatusMsg('Format tidak dikenali. Masukkan ORCID atau DOI yang valid.');
          setTimeout(() => setStatusMsg(''), 4000);
        }
      }, 300);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl p-10 md:p-16 mb-8 shadow-sm border border-gray-100 relative overflow-hidden">
      
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          Menghubungkan Riset dengan <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Tujuan Global</span>
        </h1>
        
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          Wizdam menganalisis dan mengklasifikasikan artikel ilmiah berdasarkan Sustainable Development Goals (SDGs) secara otomatis menggunakan kecerdasan buatan.
        </p>

        <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto relative">
          <div className="flex flex-col md:flex-row gap-4">
            
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-search'} text-indigo-500`}></i>
              </div>
              <input
                type="text"
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-gray-700 text-lg disabled:bg-gray-50"
                placeholder="Masukkan DOI atau ORCID"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:transform-none"
            >
              {isLoading ? 'Memproses...' : 'Analisis Sekarang'} <i className="fas fa-arrow-right ml-2"></i>
            </button>
          </div>
          
          <div className="flex justify-between items-center mt-3 px-2">
            <div className="text-left text-sm text-gray-500">
              <i className="fas fa-info-circle mr-1"></i> Contoh: 0000-0002-5152-9727 atau 10.1038/nature12373
            </div>
            {statusMsg && (
              <div className="text-right text-sm font-bold text-indigo-600 animate-pulse">
                {statusMsg}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default HeroSearch;